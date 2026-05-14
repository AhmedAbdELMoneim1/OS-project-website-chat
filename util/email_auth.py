from email.message import EmailMessage
import aiosmtplib
from os import getenv
from dotenv import load_dotenv
from secrets import choice

load_dotenv()

async def send_email(recipient: str, otp: str):
    print(recipient)
    message = EmailMessage()
    message["Subject"] = "Streamline Verification Code"
    message.set_content(f"({otp}) is you Streamline verification code.")
    await aiosmtplib.send(
        message,
        recipients=recipient,
        sender=getenv("EMAIL"),
        hostname=getenv("EMAIL_HOST"),
        port=587,
        start_tls=True,
        username=getenv("EMAIL"),
        password=getenv("EMAIL_PASSWORD")
    )

async def generate_otp():
   return "".join(choice("0123456789") for _ in range(6))
