# Resource Vault ✦

> A modern, neo-brutalist personal knowledge base and resource management web application powered by **React**, **TypeScript**, **Vite**, and **Supabase Postgres**.

---

## 📸 Interface Screenshots

### 1. Home Dashboard & Library Areas
![Home Vault](/public/screenshots/home_vault.png)

### 2. Pinned & Recently Added Resources
![Pinned & Recent Resources](/public/screenshots/pinned_recently_added.png)

### 3. Add & Edit Resource Modal
![Add Resource Modal](/public/screenshots/add_resource_modal.png)

### 4. Interactive All-Resources Table & Bulk Selection Toolbar
![All Resources Table](/public/screenshots/all_resources_table.png)

### 5. Area Subtopics & Bulk Move Workflow
![Topic Selection Table](/public/screenshots/topic_selection_table.png)

---

## ✨ Features

- 📁 **4 Core Knowledge Areas**: Organize resources into `Career`, `Computer`, `AI & Tech`, and `Personal`.
- 🗂️ **Dynamic Subtopics**: Create, rename, move, and manage subtopics per area seamlessly.
- 📌 **Home & Subtopic Pinning**: Pin your most frequently accessed docs, articles, videos, and tools to the Home page or specific subtopics.
- 🛠️ **Bulk Selection & Actions**: Select 1 or multiple items to bulk move, bulk pin/unpin, or bulk delete.
- 📂 **Move Modal with Subtopic Dropdown**: Move single or multiple resources to any Area and select from existing subtopics or create a brand new subtopic on the fly.
- 📄 **File Attachment Preview**: Preview images, PDFs, and media attachments with fallback badges.
- 🗑️ **Recycle Bin UI**: Dedicated view for managing soft-deleted resources.
- 👤 **User Profile UI**: Profile view with display name editing and user settings.
- 🎨 **Neo-Brutalist Aesthetic**: Retro windows-inspired header bars, bold 2px black borders, hard-offset drop shadows, and vibrant color-coded area accents.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Custom Neo-Brutalist CSS Design System (Vanilla CSS)
- **Icons**: Lucide React
- **Database**: Supabase Postgres (`resources`, `subtopics`, `home_pins`, `subtopic_pins`, `profiles`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Subhalakshmi279/Resource-Vault.git
   cd Resource-Vault
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🗄️ Database Setup (Supabase)

Resource Vault uses Supabase Postgres as its single source of truth. Ensure your Supabase instance has the required tables:

- `resources`: Stores title, url, file_path, area, topic, subtopic_id, type, tags, notes, description, created_at, deleted_at, user_id.
- `subtopics`: Stores area, name, user_id.
- `home_pins`: Stores resource_id, user_id.
- `profiles`: Stores id, display_name, avatar_url, created_at.

---

## 📄 License

MIT License. Built with 💜 by Subhalakshmi.
