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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function resetForm() {
    profileForm.reset();
    document.getElementById('profileId').value = '';
    document.getElementById('submitBtn').textContent = 'Create Profile';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('documentUpload').value = '';
}

// --- 2. CRUD OPERATIONS ---

function handleSaveProfile(event) {
    event.preventDefault(); 

    const id = document.getElementById('profileId').value;
    const documentFile = document.getElementById('documentUpload').files[0];
    // Retrieve existing document name if updating without a new file
    const existingProfile = id ? getProfiles().find(p => p.id === parseInt(id)) : null;
    const documentFileName = documentFile ? documentFile.name : (existingProfile ? existingProfile.documentFileName : '');
    
    const profileData = { 
        name: document.getElementById('name').value, 
        email: document.getElementById('email').value, 
        dob: document.getElementById('dob').value, 
        address: document.getElementById('address').value, 
        documentName: document.getElementById('documentName').value, 
        documentFileName: documentFileName 
    };

    let profiles = getProfiles();

    if (id) {
        // UPDATE Operation
        const profileIdInt = parseInt(id);
        const profileIndex = profiles.findIndex(p => p.id === profileIdInt);
        if (profileIndex !== -1) {
            profiles[profileIndex] = { ...profiles[profileIndex], id: profileIdInt, ...profileData };
            alert(`Profile for ${profileData.name} updated.`);
        }
    } else {
        // CREATE Operation
        const newId = Date.now(); 
        profiles.push({ id: newId, ...profileData });
        alert(`Profile for ${profileData.name} created.`);
    }

    saveProfiles(profiles);
    renderProfiles();
    resetForm();
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

// --- 3. RENDERING & VIEWING ---

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
        
        // Convert profile object to a safe JSON string for the download function call
        const profileJsonString = JSON.stringify(profile).replace(/"/g, '&quot;');
        
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
                <button class="view-pdf-btn" onclick="viewProfilePdf(${profile.id})">View PDF</button>
                <button class="download-btn" onclick="downloadProfile(${profileJsonString})">Download Data</button>
                <button class="edit-btn" onclick="loadProfileForEdit(${profile.id})">Edit</button>
                <button class="delete-btn" onclick="deleteProfile(${profile.id})">Delete</button>
            </div>
        `;
        
        profilesContainer.appendChild(card);
    });
}

/**
 * Displays full profile data in the JSON text view area.
 * (Kept for completeness, although PDF view is the main view)
 * @param {number} id
 */
function viewProfileDetails(id) {
    const profiles = getProfiles();
    const profile = profiles.find(p => p.id === id);

    if (profile) {
        profileDetailsContent.textContent = JSON.stringify(profile, null, 4); 
        
        viewArea.style.display = 'block';
        viewArea.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- 4. PDF View/Print & Download ---

function viewProfilePdf(id) {
    const profiles = getProfiles();
    const profile = profiles.find(p => p.id === id);

    if (profile) {
        const contentHtml = `
            <h3>Profile Summary: ${profile.name}</h3>
            <p><strong>Full Name:</strong> ${profile.name}</p>
            <p><strong>Email:</strong> ${profile.email}</p>
            <p><strong>Date of Birth:</strong> ${profile.dob || 'N/A'}</p>
            <p><strong>Address:</strong> ${profile.address || 'N/A'}</p>
            
            <hr style="border-top: 1px dashed #ccc;">
            
            <h3>Document Details</h3>
            <p><strong>Document Type:</strong> ${profile.documentName || 'N/A'}</p>
            <p><strong>File Tracked:</strong> ${profile.documentFileName || 'No file tracked'}</p>
            <p style="font-size: 0.8em; color: gray;">System ID: ${profile.id}</p>
        `;

        pdfViewContent.innerHTML = contentHtml;
        pdfViewContainer.style.display = 'block';
        pdfViewContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function downloadProfile(profileData) {
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
    alert(`Downloading profile for ${profileData.name}...`);
}

// --- 5. EVENT LISTENERS & INITIALIZATION ---

// Expose functions globally for use in inline onclick handlers (important for cards)
window.loadProfileForEdit = loadProfileForEdit;
window.deleteProfile = deleteProfile;
window.viewProfileDetails = viewProfileDetails;
window.downloadProfile = downloadProfile;
window.viewProfilePdf = viewProfilePdf; // Expose the new PDF view function

// Form Submission listener
profileForm.addEventListener('submit', handleSaveProfile);

// Cancel Button listener
document.getElementById('cancelBtn').addEventListener('click', resetForm);

// Close View Button listener
document.getElementById('closeViewBtn').addEventListener('click', () => {
    viewArea.style.display = 'none';
});

// Print PDF Button listener
document.getElementById('printPdfBtn').addEventListener('click', () => {
    const printContent = pdfViewContent.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Profile PDF View</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; }
                h3 { color: #191970; border-bottom: 2px solid #191970; padding-bottom: 5px; margin-top: 20px; }
                p { margin-bottom: 8px; }
                strong { display: inline-block; width: 150px; }
            </style>
        </head>
        <body>${printContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
});

// Close PDF View listener
document.getElementById('closePdfBtn').addEventListener('click', () => {
    pdfViewContainer.style.display = 'none';
});

// Initial load of data when the page loads
window.onload = renderProfiles;