// Earnings Calculator Logic
document.addEventListener('DOMContentLoaded', function() {
    const jobsInput = document.getElementById('jobs');
    const rateInput = document.getElementById('rate');
    const daysInput = document.getElementById('days');
    const jobsValue = document.getElementById('jobs-value');
    const rateValue = document.getElementById('rate-value');
    const daysValue = document.getElementById('days-value');
    const earningsDisplay = document.getElementById('earnings');

    function calculateEarnings() {
        const jobs = parseInt(jobsInput.value);
        const rate = parseInt(rateInput.value);
        const days = parseInt(daysInput.value);
        
        // Calculate gross earnings
        const grossEarnings = jobs * rate * days;
        
        // Subtract service fee (12.5% average)
        const netEarnings = grossEarnings * 0.875;
        
        // Format with Indian rupee commas
        earningsDisplay.textContent = netEarnings.toLocaleString('en-IN');
    }

    // Update displayed values and calculate when sliders change
    jobsInput.addEventListener('input', function() {
        jobsValue.textContent = this.value;
        calculateEarnings();
    });

    rateInput.addEventListener('input', function() {
        rateValue.textContent = this.value;
        calculateEarnings();
    });

    daysInput.addEventListener('input', function() {
        daysValue.textContent = this.value;
        calculateEarnings();
    });

    // Initialize calculator
    calculateEarnings();

    // FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const answer = question.nextElementSibling;
            
            // Close all other open items
            document.querySelectorAll('.faq-item').forEach(faqItem => {
                if (faqItem !== item) {
                    faqItem.classList.remove('active');
                    faqItem.querySelector('.faq-answer').style.maxHeight = null;
                    faqItem.querySelector('.faq-question i').className = 'fas fa-chevron-down';
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
            const icon = question.querySelector('i');
            
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                icon.className = 'fas fa-chevron-up';
            } else {
                answer.style.maxHeight = null;
                icon.className = 'fas fa-chevron-down';
            }
        });
    });

    // Form Validation
    const technicianForm = document.getElementById('technicianForm');
    if (technicianForm) {
        technicianForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simple validation
            let isValid = true;
            const requiredFields = this.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('error');
                    isValid = false;
                } else {
                    field.classList.remove('error');
                }
            });
            
            if (!this.querySelector('#terms').checked) {
                this.querySelector('#terms').nextElementSibling.classList.add('error');
                isValid = false;
            } else {
                this.querySelector('#terms').nextElementSibling.classList.remove('error');
            }
            
            if (isValid) {
                // In a real app, you would submit to your backend here
                alert('Thank you for your application! Our team will contact you within 24 hours.');
                this.reset();
                
                // Scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }
});