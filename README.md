🌐 [English](README.md) | [فارسی](README.fa.md)

# 💬 Messanger

A simple Messenger application built with **FastAPI**, for learning and practicing how to build a real-time chat room with Python.

## ✨ Features

- 🔐 User authentication (sign up and login)
- 🏠 Creating and managing chat rooms
- 💬 Sending and receiving messages in rooms
- ⚡ Real-time communication with WebSocket
- 🎨 User interface with Jinja2 Templates + CSS/JS

## 🛠 Technologies Used

| Part | Technology |
|---|---|
| Backend | Python, FastAPI |
| Database | SQLAlchemy |
| Templating | Jinja2 |
| Real-time | WebSockets |
| Server | Uvicorn |

## 📁 Project Structure

```
messanger/
├── database/       # Models and database connection
├── routers/        # Routes for auth, pages, rooms, messages
├── services/        # Service logic (e.g. auth_service)
├── static/          # CSS and JS files
├── templates/       # HTML templates (Jinja2)
├── main.py          # Main application entry point
└── requirements.txt # Project dependencies
```

## 🚀 Installation and Running

### Prerequisites
- Python 3.10 or higher

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/rzmahdi/messanger.git
cd messanger

# Create a virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
uvicorn main:app --reload
```

After running, the application will be available at:

```
http://127.0.0.1:8000
```

Automatic API documentation (Swagger) can also be viewed here:

```
http://127.0.0.1:8000/docs
```

## 🗺 Roadmap

- [ ] Add file and image upload in chat
- [ ] Private messages between two users
- [ ] Online/offline user status notifications
- [ ] Write automated tests

## 🤝 Contributing

If you have any suggestions or find bugs, I'd be happy for you to open an Issue or Pull Request.
