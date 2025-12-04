// Global configuration and state
const STORAGE_KEY = 'detailedProfilesData';
const profilesContainer = document.getElementById('profilesContainer');
const profileForm = document.getElementById('profileForm');
const viewArea = document.getElementById('viewProfileArea');
const profileDetailsContent = document.getElementById('profileDetailsContent');
const pdfViewContainer = document.getElementById('pdfViewContainer');
const pdfViewContent = document.getElementById('pdfViewContent');


// --- 1. CORE DATA & UTILITIES ---

function getProfiles() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveProfiles(profiles) {
    // Note: localStorage has size limits (typically 5MB). Storing large files will fail.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function resetForm() {
    profileForm.reset();
    document.getElementById('profileId').value = '';
    document.getElementById('submitBtn').textContent = 'Create Profile';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('documentUpload').value = '';
}

// Helper function to finish CRUD logic after file reading
function saveAndRender(data, id) {
    let profiles = getProfiles();

    if (id) {
        // UPDATE Operation
        const profileIdInt = parseInt(id);
        const index = profiles.findIndex(p => p.id === profileIdInt);
        if (index !== -1) {
            profiles[index] = { ...profiles[index], ...data };
            alert(`Profile for ${data.name} updated.`);
        }
    } else {
        // CREATE Operation
        const newId = Date.now();
        profiles.push({ id: newId, ...data });
        alert(`Profile for ${data.name} created.`);
    }

    saveProfiles(profiles);
    renderProfiles();
    resetForm();
}


// --- 2. CRUD OPERATIONS (Includes Base64 File Content Reading) ---

function handleSaveProfile(event) {
    event.preventDefault(); 

    const id = document.getElementById('profileId').value;
    const documentFile = document.getElementById('documentUpload').files[0];
    
    // Get existing profile for reference
    const existingProfile = id ? getProfiles().find(p => p.id === parseInt(id)) : null;

    // 1. Prepare base profile data
    const profileData = { 
        name: document.getElementById('name').value, 
        email: document.getElementById('email').value, 
        dob: document.getElementById('dob').value, 
        address: document.getElementById('address').value, 
        documentName: document.getElementById('documentName').value, 
        // Retain file name and content if no new file is uploaded
        documentFileName: existingProfile ? existingProfile.documentFileName : '', 
        documentContent: existingProfile ? existingProfile.documentContent : null 
    };

    if (documentFile) {
        // A new file was selected, read its content
        profileData.documentFileName = documentFile.name; // Update file name
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // 2. Store the Base64 result (Data URL)
            profileData.documentContent = e.target.result;
            // 3. Continue to save
            saveAndRender(profileData, id);
        };
        // 4. Read the file as a data URL (Base64 string)
        reader.readAsDataURL(documentFile);
    } else {
        // No new file, proceed directly to save
        saveAndRender(profileData, id);
    }
}

function deleteProfile(id) {
    if (confirm('Are you sure you want to permanently delete this profile?')) {
        let profiles = getProfiles();
        profiles = profiles.filter(p => p.id !== id);
        
        saveProfiles(profiles);
        renderProfiles();
        resetForm();
        alert('Profile Deleted Successfully!');
    }
}

function loadProfileForEdit(id) {
    const profiles = getProfiles();
    const profile = profiles.find(p => p.id === id);

    if (profile) {
        document.getElementById('profileId').value = profile.id;
        document.getElementById('name').value = profile.name;
        document.getElementById('email').value = profile.email;
        document.getElementById('dob').value = profile.dob || '';
        document.getElementById('address').value = profile.address || '';
        document.getElementById('documentName').value = profile.documentName || '';

        document.getElementById('submitBtn').textContent = 'Save Changes';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
        profileForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- 3. RENDERING & VIEWING (Modified Button Layout) ---

function renderProfiles() {
    profilesContainer.innerHTML = ''; 
    const profiles = getProfiles();

    if (profiles.length === 0) {
        profilesContainer.innerHTML = '<p style="text-align: center; margin-top: 30px;">No profiles found in the directory.</p>';
        return;
    }
    
    // --- Unique Unicode Icons ---
    const ICON_EMAIL = '📧'; 
    const ICON_DOB = '🗓️'; 
    const ICON_ADDRESS = '📍'; 
    const ICON_DOC = '🗂️'; 

    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.setAttribute('data-id', profile.id);
        
        // Determine button visibility based on document content availability
        // If content is stored, show View/Download. Otherwise, show File Not Stored.
        const viewDownloadButton = profile.documentContent 
            ? `<button class="view-pdf-btn" onclick="viewProfilePdf(${profile.id})">View/Download File</button>`
            : `<button class="view-pdf-btn" disabled style="background-color: #AABBCB;">File Not Stored</button>`;

        // The specific button layout you requested
        card.innerHTML = `
            <div class="card-header">
                <h3>${profile.name}</h3>
                <span style="color: #6C7A89; font-size: 0.9em;">ID: ${profile.id}</span>
            </div>

            <div class="card-body">
                <div class="card-detail-item">
                    <span class="card-icon">${ICON_EMAIL}</span>
                    <span>${profile.email}</span>
                </div>
                
                <div class="card-detail-item">
                    <span class="card-icon">${ICON_DOB}</span>
                    <span>${profile.dob || 'Date Not Set'}</span>
                </div>
                
                <div class="card-detail-item">
                    <span class="card-icon">${ICON_ADDRESS}</span>
                    <span>${profile.address ? profile.address.substring(0, 50) + '...' : 'Address Missing'}</span>
                </div>
                
                <div class="card-detail-item">
                    <span class="card-icon">${ICON_DOC}</span>
                    <span>${profile.documentName || 'No Document Listed'} (${profile.documentFileName || 'N/A'})</span>
                </div>
            </div>

            <div class="card-actions">
                ${viewDownloadButton} 
                <button class="edit-btn" onclick="loadProfileForEdit(${profile.id})">Edit</button>
                <button class="download-btn" onclick="downloadProfileData(${profile.id})">Download JSON Data</button>
                <button class="delete-btn" onclick="deleteProfile(${profile.id})">Delete</button>
            </div>
        `;
        
        profilesContainer.appendChild(card);
    });
}

/**
 * Downloads the profile data as a JSON file. 
 * @param {number} id
 */
function downloadProfileData(id) {
    const profiles = getProfiles();
    const profileData = profiles.find(p => p.id === id);
    
    if (!profileData) {
        alert('Profile not found!');
        return;
    }
    
    const dataStr = JSON.stringify(profileData, null, 4);
    const blob = new Blob([dataStr], { type: "text/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const filename = profileData.name.replace(/\s/g, '_').replace(/[^\w]/g, '') + '_Profile.json';
    link.download = filename;
    
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    alert(`Downloading profile data for ${profileData.name}...`);
}

// --- 4. PDF View/Print & Download (Updated View Panel Actions) ---

function viewProfilePdf(id) {
    const profiles = getProfiles();
    const profile = profiles.find(p => p.id === id);

    if (profile && profile.documentContent) {
        const fileExtension = profile.documentFileName.split('.').pop().toLowerCase();
        let previewContent = '';
        
        // 1. Attempt to preview common image formats
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
            // Use the Base64 string as the image source!
            previewContent = `
                <h3>Image Preview</h3>
                <img src="${profile.documentContent}" style="max-width: 100%; height: auto; border: 1px solid #ccc; margin-top: 15px;">
            `;
        } else {
             // Fallback for PDF, DOCX, or other file types
             previewContent = `
                <h3>Document View/Download</h3>
                <p>The document <strong>'${profile.documentFileName}'</strong> has been successfully stored (Type: .${fileExtension}).</p>
                <p>A direct preview for this file type is not available in the simulated view.</p>
            `;
        }
        
        // 2. Add the download button (The crucial element to get the original file)
        const downloadButtonHtml = `
            <button type="button" id="downloadOriginalFileBtn" 
                style="background-color: #28A745; color: white; margin-top: 15px; margin-right: 15px;">
                Download Original File
            </button>
        `;

        pdfViewContent.innerHTML = `
            ${previewContent}
            <hr style="border-top: 1px dashed #ccc;">
            <p><strong>Document Type:</strong> ${profile.documentName || 'N/A'}</p>
            <p><strong>File Tracked:</strong> ${profile.documentFileName || 'No file tracked'}</p>
            ${downloadButtonHtml}
        `;
        
        // Attach event listener to the new download button
        document.getElementById('downloadOriginalFileBtn').onclick = () => {
            downloadOriginalFile(profile.documentContent, profile.documentFileName);
        };

        pdfViewContainer.style.display = 'block';
        pdfViewContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
        pdfViewContent.innerHTML = `
            <h3>Document Details</h3>
            <p><strong>Document Type:</strong> ${profile.documentName || 'N/A'}</p>
            <p><strong>File Tracked:</strong> ${profile.documentFileName || 'No file tracked'}</p>
            <hr style="border-top: 1px dashed #ccc;">
            <p style="color: red; font-weight: bold; margin-top: 15px;">
                ⚠️ NOTE: No document content was stored for this profile (ID: ${profile.id}). 
                Please edit the profile and upload a file to enable viewing/downloading.
            </p>
        `;
        pdfViewContainer.style.display = 'block';
        pdfViewContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Downloads the actual file content stored as a Base64 string.
 * @param {string} dataUrl - The Base64 data URL string (e.g., 'data:image/png;base64,...').
 * @param {string} filename - The original file name.
 */
function downloadOriginalFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl; // Base64 string is directly usable as href
    link.download = filename;
    
    // Simulate a click to start the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Starting download for ${filename}...`);
}


// --- 5. EVENT LISTENERS & INITIALIZATION (Updated) ---

// Expose functions globally for use in inline onclick handlers
window.loadProfileForEdit = loadProfileForEdit;
window.deleteProfile = deleteProfile;
window.downloadProfileData = downloadProfileData; 
window.viewProfilePdf = viewProfilePdf; 

// Form Submission listener
profileForm.addEventListener('submit', handleSaveProfile);

// Cancel Button listener
document.getElementById('cancelBtn').addEventListener('click', resetForm);

// Close View Button listener (for JSON view)
document.getElementById('closeViewBtn').addEventListener('click', () => {
    viewArea.style.display = 'none';
});

// REMOVED: The printPdfBtn listener is removed as requested to simplify the view actions.

// Close PDF View listener
document.getElementById('closePdfBtn').addEventListener('click', () => {
    pdfViewContainer.style.display = 'none';
});

// Initial load of data when the page loads
window.onload = renderProfiles;
