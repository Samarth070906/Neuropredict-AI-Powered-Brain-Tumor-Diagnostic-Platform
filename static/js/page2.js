document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    document.getElementById('username-header').textContent = `Welcome, ${username}`;
});

document.getElementById('patientForm').addEventListener('submit', function(event) {
    event.preventDefault();
    window.location.href = `page3.html?name=${document.getElementById('name').value}&age=${document.getElementById('age').value}`;
});
