# 💬 Messanger
 
یک اپلیکیشن ساده پیام‌رسان (Messenger) ساخته‌شده با **FastAPI**، برای یادگیری و تمرین ساخت یک چت روم بلادرنگ (real-time) با پایتون.
 
## ✨ امکانات
 
- 🔐 احراز هویت کاربران (ثبت‌نام و ورود)
- 🏠 ایجاد و مدیریت روم‌های چت
- 💬 ارسال و دریافت پیام در روم‌ها
- ⚡ ارتباط بلادرنگ با WebSocket
- 🎨 رابط کاربری با Jinja2 Templates + CSS/JS
 
## 🛠 تکنولوژی‌های استفاده‌شده
 
| بخش | تکنولوژی |
|---|---|
| بک‌اند | Python, FastAPI |
| دیتابیس | SQLAlchemy |
| قالب‌بندی صفحات | Jinja2 |
| بلادرنگ | WebSockets |
| سرور | Uvicorn |
 
## 📁 ساختار پروژه
 
```
messanger/
├── database/       # مدل‌ها و اتصال به دیتابیس
├── routers/        # مسیرهای auth, pages, rooms, messages
├── services/        # منطق سرویس‌ها (مثلاً auth_service)
├── static/          # فایل‌های CSS و JS
├── templates/       # قالب‌های HTML (Jinja2)
├── main.py          # نقطه‌ی ورود اصلی اپلیکیشن
└── requirements.txt # وابستگی‌های پروژه
```
 
## 🚀 نصب و اجرا
 
### پیش‌نیازها
- Python 3.10 یا بالاتر
 
### مراحل نصب
 
```bash
# کلون کردن ریپازیتوری
git clone https://github.com/rzmahdi/messanger.git
cd messanger
 
# ساخت محیط مجازی
python -m venv venv
source venv/bin/activate   # در ویندوز: venv\Scripts\activate
 
# نصب وابستگی‌ها
pip install -r requirements.txt
 
# اجرای برنامه
uvicorn main:app --reload
```
 
بعد از اجرا، برنامه روی آدرس زیر در دسترس خواهد بود:
 
```
http://127.0.0.1:8000
```
 
مستندات خودکار API (Swagger) هم این‌جا قابل مشاهده است:
 
```
http://127.0.0.1:8000/docs
```
 
## 🗺 نقشه‌ی راه (Roadmap)
 
- [ ] افزودن آپلود فایل و عکس در چت
- [ ] پیام‌های خصوصی بین دو کاربر
- [ ] اطلاع‌رسانی آنلاین/آفلاین بودن کاربران
- [ ] نوشتن تست‌های خودکار
 
## 🤝 مشارکت
 
اگر پیشنهاد یا باگی دیدید، خوش‌حال می‌شوم Issue یا Pull Request بزنید.
