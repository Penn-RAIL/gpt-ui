from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import base64
import binascii
import csv
import io
from PyPDF2 import PdfReader
from openai import AzureOpenAI
import openai # Import for error types
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173", # Default Vite/Bun dev port
    "http://127.0.0.1:5173",
    "http://localhost:3000", # Common React dev port
    "http://localhost:8000", # Common React dev port
    # Add other origins if needed (e.g., your deployed frontend URL)
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Origins allowed (adjust the list above!)
    allow_credentials=True,      # Allow cookies/auth headers if needed later
    allow_methods=["*"],         # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],         # Allow all headers (like Content-Type)
)

# Pydantic Models
class FileData(BaseModel):
    filename: str
    content: str  # Base64 encoded file content

class ChatRequest(BaseModel):
    azureEndpoint: str
    azureApiKey: str
    model: str
    systemPrompt: str
    userPrompt: str
    files: Optional[List[FileData]] = None

class ChatResponse(BaseModel):
    response: str

@app.get("/")
async def read_root():
    return {"message": "Backend is running"}

def extract_text_from_files(files: Optional[List[FileData]]) -> str:
    """Decodes files and extracts text content based on file type."""
    if not files:
        return ""

    extracted_text = ""
    print(f"Processing {len(files)} attached files...")
    for file_data in files:
        try:
            # Decode base64 content
            decoded_bytes = base64.b64decode(file_data.content)
            print(f"Successfully decoded file: {file_data.filename}, type: {type(decoded_bytes)}")

            # Check file type and extract content
            if file_data.filename.lower().endswith('.csv'):
                try:
                    decoded_string = decoded_bytes.decode('utf-8')
                    string_io = io.StringIO(decoded_string)
                    reader = csv.reader(string_io)
                    file_content = []
                    for row in reader:
                        file_content.append(",".join(row))
                    if file_content:
                        extracted_text += f"\n--- Content from {file_data.filename} ---\n"
                        extracted_text += "\n".join(file_content)
                        print(f"Extracted content from CSV: {file_data.filename}")
                except UnicodeDecodeError:
                    print(f"Warning: Could not decode file {file_data.filename} as UTF-8. Skipping CSV processing.")
                except csv.Error as e:
                    print(f"Warning: Error reading CSV file {file_data.filename}: {e}. Skipping CSV processing.")

            elif file_data.filename.lower().endswith('.pdf'):
                try:
                    pdf_stream = io.BytesIO(decoded_bytes)
                    reader = PdfReader(pdf_stream)
                    if reader.is_encrypted:
                        print(f"Warning: PDF file {file_data.filename} is encrypted. Skipping extraction.")
                        continue
                    file_content = []
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            file_content.append(page_text)
                    if file_content:
                        extracted_text += f"\n--- Content from {file_data.filename} ---\n"
                        extracted_text += "\n".join(file_content)
                        print(f"Extracted content from PDF: {file_data.filename}")
                    else:
                        print(f"Could not extract text from PDF: {file_data.filename} (might be image-based or empty)." )
                except Exception as e:
                    print(f"Error processing PDF {file_data.filename}: {e}")

            # TODO: Add handlers for other file types (e.g., TXT, DOCX) here

        except binascii.Error:
            print(f"Warning: Could not decode base64 content for file {file_data.filename}. Skipping this file.")
        except Exception as e:
             print(f"An unexpected error occurred while processing file {file_data.filename}: {e}")

    return extracted_text

def get_openai_response(azure_endpoint: str, api_key: str, model: str, messages: list) -> str:
    """Calls the Azure OpenAI API and returns the response content."""
    try:
        client = AzureOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=api_key,
            api_version="2025-03-01-preview"  # Use the appropriate API version
        )

        completion = client.chat.completions.create(
            model="gpt-4-32k",
            messages=messages,
            temperature=0.7,  # Example: Adjust as needed
            max_tokens=1000   # Example: Adjust as needed
        )

        if not completion.choices or not completion.choices[0].message:
            print("Error: OpenAI response missing choices or message.")
            raise HTTPException(status_code=500, detail="Failed to get valid response from OpenAI model.")

        message_content = completion.choices[0].message.content
        print(f"--- OpenAI Response ---\n{message_content}\n-----------------------")

        return message_content or "Model returned empty content."

    except openai.AuthenticationError as e:
        print(f"OpenAI Authentication Error: {e}")
        raise HTTPException(status_code=401, detail=f"Azure OpenAI Authentication Error: {str(e)}")
    except openai.RateLimitError as e:
        print(f"OpenAI Rate Limit Error: {e}")
        raise HTTPException(status_code=429, detail=f"Azure OpenAI Rate Limit Exceeded: {str(e)}")
    except openai.BadRequestError as e:
        print(f"OpenAI Bad Request Error: {e}")
        raise HTTPException(status_code=400, detail=f"Azure OpenAI Bad Request Error: {str(e)}")
    except openai.APIError as e:
        print(f"OpenAI API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Azure OpenAI API Error: {str(e)}")
    # Note: General Exception handling remains in the main endpoint

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Accepts chat requests, extracts text from files, calls OpenAI, and returns the response."""
    print(f"Received request: {request.model_dump_json(indent=2)}")
    try:
        # Extract text from attached files using the helper function
        extracted_text = extract_text_from_files(request.files)
        if extracted_text:
             print(f"\n--- Total Extracted Text ---\n{extracted_text}\n-----------------------------")

        # Prepare messages for OpenAI
        if extracted_text:
            final_user_prompt = f"{request.userPrompt}\n\n--- EXTRACTED FILE CONTENT ---\n{extracted_text}"
        else:
            final_user_prompt = request.userPrompt

        messages = [
            {"role": "system", "content": request.systemPrompt},
            {"role": "user", "content": final_user_prompt}
        ]

        print(f"\n--- Messages for OpenAI ---\n{messages}\n---------------------------")

        # Call Azure OpenAI API using the helper function
        response_content = get_openai_response(
            azure_endpoint=request.azureEndpoint,
            api_key=request.azureApiKey,
            model=request.model,
            messages=messages
        )

        # Return the successful response
        return ChatResponse(response=response_content)

        # # Call Azure OpenAI API
        # try:
        #     client = AzureOpenAI(
        #         azure_endpoint=request.azureEndpoint,
        #         api_key=request.azureApiKey,
        #         api_version="2024-02-01"  # Use the appropriate API version
        #     )
        #
        #     completion = client.chat.completions.create(
        #         model=request.model,
        #         messages=messages,
        #         temperature=0.7,  # Example: Adjust as needed
        #         max_tokens=1000   # Example: Adjust as needed
        #     )
        #
        #     if not completion.choices or not completion.choices[0].message:
        #         raise HTTPException(status_code=500, detail="Failed to get response from OpenAI model.")
        #
        #     message_content = completion.choices[0].message.content
        #     print(f"--- OpenAI Response ---\n{message_content}\n-----------------------")
        #
        #     return ChatResponse(response=message_content or "Model returned empty content.")
        #
        # except openai.AuthenticationError as e:
        #     raise HTTPException(status_code=401, detail=f"Azure OpenAI Authentication Error: {str(e)}")
        # except openai.RateLimitError as e:
        #     raise HTTPException(status_code=429, detail=f"Azure OpenAI Rate Limit Exceeded: {str(e)}")
        # except openai.BadRequestError as e:
        #     # Often indicates issues with the request structure or content filter
        #     raise HTTPException(status_code=400, detail=f"Azure OpenAI Bad Request Error: {str(e)}")
        # except openai.APIError as e:
        #     # Catch other API-related errors
        #     raise HTTPException(status_code=500, detail=f"Azure OpenAI API Error: {str(e)}")

    except HTTPException as he: # Re-raise HTTPExceptions from helpers
        raise he
    except Exception as e:
        # Catch any other unexpected errors during text extraction or message prep
        print(f"An unexpected error occurred in chat_endpoint: {e}") # Log the full error
        raise HTTPException(status_code=500, detail=f"An unexpected internal error occurred: {str(e)}")

# To install requirements:
# pip install -r requirements.txt

# To run the server (from the railgptbackend directory):
# uvicorn main:app --reload --port 8000 