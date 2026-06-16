from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(hashed_password: str, password: str):
    return password_hash.verify(password, hashed_password)