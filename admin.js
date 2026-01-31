// Admin Login

const ADMIN_PASSWORD = 'admin123';

const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');

if (loginBtn) {
  loginBtn.addEventListener('click', function (e) {
    e.preventDefault();

    const password = passwordInput.value.trim();

    if (password === ADMIN_PASSWORD) {
      
      document.querySelector('.login-container').style.display = 'none';

      document.getElementById('dashboardContainer').style.display = 'block';

      loadMembers();
    } else {
      loginError.innerText = 'Incorrect password. Try again!';
    }
  });

  passwordInput.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') loginBtn.click();
  });
}

// Google Sheets Config

const SHEET_URL =
  'https://script.google.com/macros/s/AKfycbytYnixM4C2s_EcVpWsFmD9Cpo8yCBzOt9mJn4ZLJj0erH1rENRipMLkpdz2bJIo1E2ww/exec';

let members = [];

// Load Members

async function loadMembers() {
  try {
    const res = await fetch(SHEET_URL);
    members = await res.json();
    renderMemberTable();
    updateSummary();
  } catch (err) {
    console.error('Error loading members:', err);
    alert('Failed to load members from Google Sheets.');
  }
}

// Save Member


async function saveMemberToSheet(member, action) {
  try {
    const params = new URLSearchParams({
      action,
      name: member.name || '',
      role: member.role || '',
      team: member.team || '',
      points: member.points ?? 0,
      oldName: member.oldName || '',
    });

    await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    loadMembers();
  } catch (err) {
    console.error(err);
    alert('Failed to save member to Google Sheets.');
  }
}

// Member Status

function getStatus(points) {
  if (points >= 6) return 'Active';
  else if (points >= 3) return 'At Risk';
  else if (points >= 1) return 'Critical';
  else return 'Eliminated';
}

function getStatusClass(status) {
  switch (status) {
    case 'Active':
      return 'active';
    case 'At Risk':
      return 'at-risk';
    case 'Critical':
      return 'critical';
    case 'Eliminated':
      return 'eliminated';
  }
}

// Summary Update

function updateSummary() {
  const total = members.length;
  const active = members.filter(m => getStatus(m.points) === 'Active').length;
  const atRisk = members.filter(m => getStatus(m.points) === 'At Risk').length;
  const eliminated = members.filter(m => getStatus(m.points) === 'Eliminated').length;

  document.getElementById('totalMembers').innerText = total;
  document.getElementById('activeMembers').innerText = active;
  document.getElementById('atRiskMembers').innerText = atRisk;
  document.getElementById('eliminatedMembers').innerText = eliminated;
}

// Change Points

function changePoints(index, delta) {
  members[index].points += delta;

  if (members[index].points < 0) members[index].points = 0;

  saveMemberToSheet(members[index], 'update');
}

// Render Member Table

function renderMemberTable() {
  const tbody = document.getElementById('memberTableBody');
  if (!tbody) return;

  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const teamFilter = document.getElementById('teamFilter')?.value || '';
  const roleFilter = document.getElementById('roleFilter')?.value || '';
  const sortOrder = document.getElementById('sortPoints')?.value || 'desc';

  let filtered = members.filter(m =>
    m.name.toLowerCase().includes(search) &&
    (teamFilter ? m.team === teamFilter : true) &&
    (roleFilter ? m.role === roleFilter : true)
  );

  filtered.sort((a, b) =>
    sortOrder === 'desc' ? b.points - a.points : a.points - b.points
  );

  tbody.innerHTML = '';

  filtered.forEach(m => {
    const status = getStatus(m.points);
    const index = members.indexOf(m);

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${m.name}</td>
      <td>${m.role}</td>
      <td>${m.team}</td>
      <td>
        <span>${m.points}</span>
        <button class="point-btn" onclick="changePoints(${index}, 1)">+</button>
        <button class="point-btn" onclick="changePoints(${index}, -1)">-</button>
      </td>
      <td>
        <span class="status-badge ${getStatusClass(status)}">${status}</span>
      </td>
      <td>
        <button onclick="editMember(${index})">Edit</button>
        <button onclick="deleteMember(${index})">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  updateSummary();
}

// Add / Edit / Delete Member


let editIndex = null;

function openAddModal() {
  editIndex = null;

  document.getElementById('modalTitle').innerText = 'Add Member';
  document.getElementById('memberName').value = '';
  document.getElementById('memberRole').value = 'President';
  document.getElementById('memberTeam').value = 'Society Affairs';
  document.getElementById('memberPoints').value = 0;
  document.getElementById('memberModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('memberModal').style.display = 'none';
}

function saveMember() {
  const name = document.getElementById('memberName').value.trim();
  const role = document.getElementById('memberRole').value;
  const team = document.getElementById('memberTeam').value;
  const points = parseInt(document.getElementById('memberPoints').value) || 0;

  if (!name) {
    alert('Name required');
    return;
  }

  const memberData = { name, role, team, points };

  if (editIndex !== null) {
    memberData.oldName = members[editIndex].name;
    saveMemberToSheet(memberData, 'update');
  } else {
    saveMemberToSheet(memberData, 'add');
  }

  closeModal();
}

function editMember(index) {
  editIndex = index;
  const m = members[index];

  document.getElementById('modalTitle').innerText = 'Edit Member';
  document.getElementById('memberName').value = m.name;
  document.getElementById('memberRole').value = m.role;
  document.getElementById('memberTeam').value = m.team;
  document.getElementById('memberPoints').value = m.points;
  document.getElementById('memberModal').style.display = 'flex';
}

function deleteMember(index) {
  if (confirm('Delete this member?')) {
    saveMemberToSheet({ name: members[index].name }, 'delete');
  }
}

// Initial Load

document.addEventListener('DOMContentLoaded', () => {
  loadMembers();
});
