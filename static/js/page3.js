document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const age = urlParams.get('age');
    document.getElementById('patient-details').textContent = `Name: ${name}, Age: ${age}`;
    
    document.getElementById('add-symptom').addEventListener('click', function() {
        const symptomInput = document.createElement('input');
        symptomInput.type = 'text';
        symptomInput.name = 'symptom';
        symptomInput.placeholder = 'Enter symptom';
        document.getElementById('symptoms-list').appendChild(symptomInput);
    });
});
