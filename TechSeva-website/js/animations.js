// Scroll animations
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.service-card, .feature-card, .step');
    
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.2;
        
        if (elementPosition < screenPosition) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

// Set initial state for animated elements
window.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.service-card, .feature-card, .step');
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Trigger first animation check
    animateOnScroll();
});

// Add scroll event listener
window.addEventListener('scroll', animateOnScroll);

// Hero image floating animation
const heroImage = document.querySelector('.hero-image img');
if (heroImage) {
    setInterval(() => {
        heroImage.style.transform = `translateY(${Math.sin(Date.now() / 1000) * 10}px)`;
    }, 50);
}