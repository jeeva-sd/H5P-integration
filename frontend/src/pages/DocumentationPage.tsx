export default function DocumentationPage() {
  return (
    <div className="documentation">
      <h1>📖 H5P Learning Guide</h1>
      
      <section>
        <h2>🎯 What is H5P?</h2>
        <p>
          H5P is a framework for creating, sharing, and reusing interactive HTML5 content. 
          It provides pre-built content types like quizzes, presentations, games, and more.
        </p>
      </section>

      <section>
        <h2>🏗️ Architecture Overview</h2>
        <div className="architecture-diagram">
          <pre>{`
┌─────────────────────────────────────────────────┐
│                  Frontend (React)               │
│  ┌─────────────┐  ┌──────────────┐             │
│  │  Content    │  │   H5P Editor │             │
│  │  List       │  │   & Player   │             │
│  └─────────────┘  └──────────────┘             │
└──────────────────┬──────────────────────────────┘
                   │ REST API
                   │
┌──────────────────┴──────────────────────────────┐
│                Backend (Node.js)                │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  H5P Editor  │  │  H5P Player  │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Content    │  │   Library    │            │
│  │   Storage    │  │   Storage    │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </section>

      <section>
        <h2>🔄 CRUD Operations</h2>
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>📋 List</td>
              <td>GET</td>
              <td>/api/content</td>
              <td>Get all content items</td>
            </tr>
            <tr>
              <td>➕ Create</td>
              <td>POST</td>
              <td>/api/content</td>
              <td>Create new content</td>
            </tr>
            <tr>
              <td>✏️ Edit</td>
              <td>GET</td>
              <td>/api/content/:id/edit</td>
              <td>Get editor with content data</td>
            </tr>
            <tr>
              <td>💾 Update</td>
              <td>PUT</td>
              <td>/api/content/:id</td>
              <td>Update existing content</td>
            </tr>
            <tr>
              <td>🗑️ Delete</td>
              <td>DELETE</td>
              <td>/api/content/:id</td>
              <td>Remove content</td>
            </tr>
            <tr>
              <td>▶️ Play</td>
              <td>GET</td>
              <td>/api/content/:id/play</td>
              <td>Get player with content</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>🔑 Key Concepts</h2>
        <ul>
          <li><strong>Libraries:</strong> Reusable content types (like plugins)</li>
          <li><strong>Content:</strong> Individual instances with user data</li>
          <li><strong>Editor:</strong> Create/modify content</li>
          <li><strong>Player:</strong> Display interactive content</li>
          <li><strong>Storage:</strong> File system or database storage</li>
        </ul>
      </section>

      <section>
        <h2>🚀 Getting Started</h2>
        <div className="tutorial-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Download H5P Libraries</h3>
              <p>First, you need to download content type libraries from <a href="https://h5p.org" target="_blank" rel="noopener noreferrer">h5p.org</a></p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Create Content</h3>
              <p>Click "Create New Content" and select a content type</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Edit & Save</h3>
              <p>Fill in the content details and click "Save Content"</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Play & Share</h3>
              <p>View your interactive content and share it with others!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
