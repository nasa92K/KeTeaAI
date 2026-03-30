import google.generativeai as genai
from datetime import datetime

import apiGeminiKey from ./.env

# Ajoutez le guillemet fermant à la fin
genai.configure(api_key=apiGeminiKey)  # Gemini API Key

model = genai.GenerativeModel('gemini-2.5-flash')
chat = model.start_chat(history=[])

def get_date_context():
    now = datetime.now()
    jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
    mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    jour_semaine = jours[now.weekday()]
    mois_nom = mois[now.month - 1]
    
    return f"""INFORMATION SYSTÈME (à utiliser OBLIGATOIREMENT):
📅 Aujourd'hui: {jour_semaine} {now.day} {mois_nom} {now.year}
🕐 Heure actuelle: {now.strftime("%H:%M:%S")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"""

print("🤖 KeTeaAI !\n")
print(f"📅 {get_date_context()}")

while True:
    user_input = input("Vous: ")
    
    if user_input.lower() in ['quit', 'exit', 'quitter']:
        print("👋 Au revoir !")
        break
    
    try:
        message_complet = get_date_context() + user_input
        response = chat.send_message(message_complet)
        print(f"IA: {response.text}\n")
        
    except Exception as e:
        print(f"❌ Erreur: {e}\n")