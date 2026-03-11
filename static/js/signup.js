document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password === confirmPassword) {
        alert('Sign up successful! Redirecting to login page.');
        window.location.href = 'index.html';
    } else {
        alert('Passwords do not match. Please try again.');
    }
});

