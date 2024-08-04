from openai import AzureOpenAI
from dotenv import load_dotenv
import os
import json

f = open('data.json')

data = json.load(f)

load_dotenv()
client = AzureOpenAI(
  api_key = os.getenv("AZURE_OPENAI_API_KEY"),  
  api_version = "2024-02-01",
  azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
)
response = client.chat.completions.create(
    model="gpt-35-turbo", 
    messages=[
        {"role": "system", "content": "Assistant is a large language model trained by OpenAI. You are supposed to Fix the code in error I will give you, please output the code only and not any text"},
        {"role": "user", "content": f"I am gonna provide you some code which is as below {data["fileContent"]}. It has the following errors {data['errorMessage']}, with the following file structure {data['fileStructure']} Please, fix the Eroor and provide the correct code. Output the code only, no text."}
    ]
)

response_date = response.choices[0].message.content
# print(response_date)

start_delimiter = "```"
end_delimiter = "```"

start_index = response_date.find(start_delimiter)
end_index = response_date.find(end_delimiter, start_index + len(start_delimiter))

if start_index != -1 and end_index != -1:
    start_index += len(start_delimiter)  
    code_content = response_date[start_index:end_index].strip()
    print(code_content)
else:
    print("No content found within triple backticks.")

filename = 'response_data.txt'

with open(filename, 'w') as file:
    file.write(code_content)