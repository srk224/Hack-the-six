from openai import AzureOpenAI
from dotenv import load_dotenv
import os

load_dotenv()
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),  
    api_version="2024-02-01",
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    )
    
deployment_name='gpt-35-turbo' #This will correspond to the custom name you chose for your deployment when you deployed a model. Use a gpt-35-turbo-instruct deployment. 
    
# Send a completion call to generate an answer
print('Sending a test completion job')
start_phrase = 'Write me some python program the prints "hello world!"'
response = client.completions.create(model=deployment_name, prompt=start_phrase, max_tokens=50)
print(start_phrase+response.choices[0].text)