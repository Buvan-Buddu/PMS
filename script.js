// Global configuration and state
const STORAGE_KEY = 'detailedProfilesData';
const profilesContainer = document.getElementById('profilesContainer');
const profileForm = document.getElementById('profileForm');
const viewArea = document.getElementById('viewProfileArea'); // JSON view (kept hidden but functional)
const profileDetailsContent = document.getElementById('profileDetailsContent');
const pdfViewContainer = document.getElementById('pdfViewContainer');
const pdfViewContent = document.getElementById('pdfViewContent');


// --- 1. CORE DATA & UTILITIES ---

function getProfiles() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveProfiles(profiles) {
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
        }
    } else {
        // CREATE Operation
        const newId = Date.now();
        profiles.push({ id: newId, ...data });
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

// --- 3. RENDERING & VIEWING (Using Image Icons and Left Alignment) ---

function renderProfiles() {
    profilesContainer.innerHTML = ''; 
    const profiles = getProfiles();

    if (profiles.length === 0) {
        profilesContainer.innerHTML = '<p style="text-align: center; margin-top: 30px;">No profiles found in the directory.</p>';
        return;
    }
    
    // --- Image Icons (Replaced Unicode) ---
    // Define a standard style for the inline images, ensuring they fit the card-icon span
    const IMG_STYLE = 'style="width: 25px; height: 25px; vertical-align: middle; margin-top: -3px;"';
    
    // 1) Email (image_7394dd.png)
    const ICON_EMAIL = `<img src="e.png" ${IMG_STYLE}>`; 
    // 2) DOB (image_73949d.jpg)
    const ICON_DOB = `<img src="c.jpg" ${IMG_STYLE}>`; 
    // 3) Address (image_739405.png)
    const ICON_ADDRESS = `<img src="l.png" ${IMG_STYLE}>`; 
    // 4) Document (image_739062.png)
    const ICON_DOC = `<img src="f.png" ${IMG_STYLE}>`; 

    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.setAttribute('data-id', profile.id);
        
        // Determine button visibility based on document content availability
        // JSON Download button is removed as requested
        const viewDownloadButton = profile.documentContent 
            ? `<button class="view-pdf-btn" onclick="viewProfilePdf(${profile.id})">View/Download File</button>`
            : `<button class="view-pdf-btn" disabled style="background-color: #AABBCB;">File Not Stored</button>`;


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
                <button class="delete-btn" onclick="deleteProfile(${profile.id})">Delete</button>
            </div>
        `;
        
        profilesContainer.appendChild(card);
    });
}

// --- 4. PDF View/Download ---

function viewProfilePdf(id) {
    const profiles = getProfiles();
    const profile = profiles.find(p => p.id === id);

    if (profile && profile.documentContent) {
        const fileExtension = profile.documentFileName.split('.').pop().toLowerCase();
        let previewContent = '';
        
        // Attempt to preview common image formats or use iframe for data URLs (works for many files)
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'pdf'].includes(fileExtension)) {
            previewContent = `
                <h3>Document Preview</h3>
                <p>Preview for this document type may not be reliable. Please use the download button below.</p>
                <iframe src="${profile.documentContent}" style="width: 100%; height: 500px; border: 1px solid #ccc; margin-top: 15px;"></iframe>
            `;
        } else {
             // Fallback for DOCX, or other file types
             previewContent = `
                <h3>Document View/Download</h3>
                <p>The document <strong>'${profile.documentFileName}'</strong> has been successfully stored (Type: .${fileExtension}).</p>
                <p>A direct preview for this file type is not available in the simulated view.</p>
            `;
        }
        
        // Add the download button
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
        // Warning if no document content is stored
        pdfViewContent.innerHTML = `
            <h3>Document Details</h3>
            <p><strong>Document Type:</strong> ${profile.documentName || 'N/A'}</p>
            <p><strong>File Tracked:</strong> ${profile.documentFileName || 'No file tracked'}</p>
            <hr style="border-top: 1px dashed #ccc;">
            <p style="color: red; font-weight: bold; margin-top: 15px;">
                ⚠️ NOTE: No document content was stored for this profile. 
                Please edit the profile and upload a file to enable viewing/downloading.
            </p>
        `;
        pdfViewContainer.style.display = 'block';
        pdfViewContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Downloads the actual file content stored as a Base64 string.
 */
function downloadOriginalFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl; // Base64 string is directly usable as href
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Starting download for ${filename}...`);
}


// --- 5. EVENT LISTENERS & INITIALIZATION ---

// Expose functions globally
window.loadProfileForEdit = loadProfileForEdit;
window.deleteProfile = deleteProfile;
window.viewProfilePdf = viewProfilePdf; 

// Form Submission listener
profileForm.addEventListener('submit', handleSaveProfile);

// Cancel Button listener
document.getElementById('cancelBtn').addEventListener('click', resetForm);

// Close PDF View listener
document.getElementById('closePdfBtn').addEventListener('click', () => {
    pdfViewContainer.style.display = 'none';
});

// Initial load of data when the page loads
window.onload = renderProfiles;
