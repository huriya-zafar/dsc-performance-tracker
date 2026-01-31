// Google Sheets Config
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbytYnixM4C2s_EcVpWsFmD9Cpo8yCBzOt9mJn4ZLJj0erH1rENRipMLkpdz2bJIo1E2ww/exec'; 
let members = [];

// Member Status
function getStatus(points){
    if(points >= 6) return 'Active';
    else if(points >= 3) return 'At Risk';
    else if(points >= 1) return 'Critical';
    else return 'Eliminated';
}
function getStatusClass(status){
    switch(status){
        case 'Active': return 'active';
        case 'At Risk': return 'at-risk';
        case 'Critical': return 'critical';
        case 'Eliminated': return 'eliminated';
    }
}

// Load Members for Leaderboard
async function loadMembers(){
    try {
        const res = await fetch(SHEET_URL);
        members = await res.json();
        renderLeaderboard();
    } catch(err){
        console.error('Error loading members:', err);
        alert('Failed to load members from Google Sheets.');
    }
}

// Render Leaderboard
function renderLeaderboard(){
    const tbody = document.getElementById('leaderboardTable');
    if(!tbody) return;

    const search = document.getElementById('leaderSearch')?.value.toLowerCase() || '';
    const teamFilter = document.getElementById('leaderTeamFilter')?.value || '';
    const sortOrder = document.getElementById('leaderSort')?.value || 'desc';

    let filtered = members.filter(m=>
        m.name.toLowerCase().includes(search) &&
        (teamFilter ? m.team===teamFilter : true)
    );

    filtered.sort((a,b)=> sortOrder==='desc'? b.points - a.points : a.points - b.points );

    tbody.innerHTML = '';
    filtered.forEach((m,index)=>{
        const status = getStatus(m.points);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index+1}</td>
            <td>${m.name}</td>
            <td>${m.role}</td>
            <td>${m.team}</td>
            <td>${m.points}</td>
            <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Initial Load
document.addEventListener('DOMContentLoaded', ()=>{ loadMembers(); });
