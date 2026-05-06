# OS Project — Website Chat

> ⚠️ **i am README: Plz Don't forget me every time :)** 🫠

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AhmedAbdELMoneim1/OS-project-website-chat
```

### 2. Navigate to the Project & Create a Virtual Environment

```bash
cd OS-project-website-chat
python3 -m venv venv
```

> **Note:** Depending on your system, use `python` instead of `python3` if the above doesn't work.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up the Database

Create the databases using the provided schema:

```bash
# Run your DB tool against schema.sql
```

> Refer to `schema.sql` in the project root for the full database structure.

### 5. Configure Environment Variables

Fill in your database credentials in `.env.example`, then copy it:

```bash
cp .env.example .env
```

### 6. Run the Project

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The app will be available at **http://localhost:8000** 🎉

---

## 📋 Quick Checklist

- [ ] Cloned the repo
- [ ] Created & activated virtual environment
- [ ] Installed requirements
- [ ] Created databases from `schema.sql`
- [ ] Filled in `.env.example` with DB variables
- [ ] Copied `.env.example` → `.env`
- [ ] Started the server
