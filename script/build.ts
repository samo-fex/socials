{
  "$schema": "https://opencode.ai/config.json",
  "provider": {

    "pollinations": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Pollinations AI",
      "options": {
        "baseURL": "https://gen.pollinations.ai/v1",
        "apiKey": "sk_UNQjqj9hPQ2X9nC5E412HOHjmnHzlmlK"
      },
      "models": {
        "glm": {
          "name": "Glm5"
          
        },
        "kimi-k2.6":{
          "name":"kimi-k2.6"
        },
        "openai-large":{
          "name":"gpt5.4"
        }

        
        }},
      "nvidia":{
        "models":{
          "minimaxai/minimax-m2.7":{
            "name": "max-2.7"
          },
          "deepseek-ai/deepseek-v4-pro":{
            "name": "deepseek-v4-pro"
          }
        }
       
      },
      "gateway": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM Gateway",
      "models": {
        "openai/openai-large": { "name": "gpt5.4" }
       
      },
      "options": {
        "baseURL": "http://127.0.0.1:4000/v1",
        "apiKey": "{env:LITELLM_MASTER_KEY}"
      }
    }
  
  
      
      }

      

    
  }
