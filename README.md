# 🎓 VidyaSetu – AI-Powered Learning & Mentorship Platform

VidyaSetu is a full-stack web application designed to bridge the gap between students and mentors through AI-driven learning, course management, and real-time analytics. It provides role-based dashboards for students, mentors, and admins, enabling personalized education experiences.


## 🌟 Features

### 👨‍🎓 Student Module

* View enrolled courses and materials
* Attempt quizzes and track progress
* Access mentorship and tutoring sessions
* Personalized dashboard


### 👩‍🏫 Mentor Module

* Create and manage courses
* Generate and evaluate quizzes
* Track student performance
* Conduct mentorship sessions


### 🛠️ Admin Module

* User management (students & mentors)
* Content moderation
* Analytics & reports
* Security and system settings


### 🤖 AI Features

* AI-powered quiz generation
* Smart content recommendations
* Automated grading and feedback


## 🏗️ Tech Stack

* **Frontend**: React + TypeScript + Vite
* **Backend**: Node.js
* **Database & Auth**: Supabase
* **Styling**: Tailwind CSS


# 🚀 Execution Steps (Windows)

## 🔹 STEP 0: Prerequisites

Make sure installed:

* Node.js (v18+)
* Git

Check:

```bash
node -v
npm -v
git -v
```


## 🔹 STEP 1: Clone the Project

```bash
git clone https://github.com/KusumaPriya15/Vidya-Setu.git
cd Vidya-Setu
```


## 🔹 STEP 2: Install Dependencies

```bash
npm install
```


## 🔹 STEP 3: Create `.env` File

In PowerShell:

```bash
New-Item .env
```

Open `.env` and add:

```env
VITE_SUPABASE_URL=https:your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

⚠️ Replace with your actual Supabase key


## 🔹 STEP 4: Run Frontend

```bash
npm run dev
```


## 🔹 STEP 5: Open Application

Open in browser:

```
http://localhost:5173/
```


## 🔹 STEP 6: Run Backend (If Required)

Open a new terminal:

```bash
cd server
npm install
npm start
```

If error:

```bash
npm run dev
```


## 🔹 STEP 7: Setup Database (Supabase)

1. Open your Supabase project
2. Go to **SQL Editor**
3. Run the following files:

   * `schema.sql`
   * `fix_rls_policies.sql`
   * `supabase_trigger_fix.sql`


## 🔹 STEP 8: Done ✅

Your application should now be running:

* Frontend → [http://localhost:5173](http://localhost:5173)
* Backend → [http://localhost:3000](http://localhost:3000) (or similar)


## 📁 Project Structure

```
.
├── components/        # Reusable UI components
├── pages/             # Application pages (student, mentor, admin)
├── lib/               # Utility functions & configurations
├── server/            # Backend services
├── supabase/          # Supabase functions
├── public/            # Static assets
├── .env               # Environment variables
├── package.json       # Project dependencies
└── vite.config.ts     # Vite configuration
```


## 🚀 Future Enhancements

* Real-time chat system
* Advanced AI recommendations
* Mobile responsiveness improvements
* Deployment optimization


## 🙏 Acknowledgment

* Supabase for backend services
* React & Vite ecosystem
* Open-source contributors


## 🎉 Final Note

VidyaSetu aims to **transform digital learning by connecting students and mentors intelligently**.
