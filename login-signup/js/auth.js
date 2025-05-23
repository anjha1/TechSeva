document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const roleButtons = document.querySelectorAll('.role-btn');
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    const emailOtpModal = document.getElementById('email-otp-modal');
    const mobileOtpModal = document.getElementById('mobile-otp-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const verifyEmailOtpBtn = document.getElementById('verify-email-otp');
    const verifyMobileOtpBtn = document.getElementById('verify-mobile-otp');
    const resendEmailOtpBtn = document.getElementById('resend-email-otp');
    const resendMobileOtpBtn = document.getElementById('resend-mobile-otp');
    const userEmailSpan = document.getElementById('user-email');
    const userMobileSpan = document.getElementById('user-mobile');
    const otpDigits = document.querySelectorAll('.otp-digit');
    
    let currentRole = 'user'; // Default role
    let currentEmail = '';
    let currentPhone = '';
    
    // Tab Switching
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });
    
    signupTab.addEventListener('click', function() {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });
    
    // Role Selection
    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            roleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentRole = this.dataset.role;
        });
    });
    
    // Toggle Password Visibility
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    });
    
    // OTP Digit Navigation
    otpDigits.forEach((digit, index) => {
        digit.addEventListener('input', function() {
            if (this.value.length === 1 && index < otpDigits.length - 1) {
                otpDigits[index + 1].focus();
            }
        });
        
        digit.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                otpDigits[index - 1].focus();
            }
        });
    });
    
    // Close Modal
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
            clearOtpFields(this.closest('.modal').id);
        });
    });
    
    // Form Submissions
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and redirect
            localStorage.setItem('token', data.token);
            if (data.role === 'user') {
                window.location.href = '../dashboard.html';
            } else {
                window.location.href = '../technician-dashboard.html';
            }
        } catch (error) {
            console.error('Login Error:', error);
            alert(error.message);
        }
    });
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        currentEmail = email;
        currentPhone = phone;
        
        // Show email OTP modal
        userEmailSpan.textContent = email;
        emailOtpModal.style.display = 'flex';
        
        // Send OTP to email
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: email,
                    type: 'email'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('OTP Error:', error);
            alert(error.message);
            emailOtpModal.style.display = 'none';
        }
    });
    
    // OTP Verification
    verifyEmailOtpBtn.addEventListener('click', async function() {
        const otp = getEnteredOtp('email-otp-modal');
        
        try {
            const response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: currentEmail,
                    otp,
                    type: 'email'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Email verified, proceed to mobile OTP
            emailOtpModal.style.display = 'none';
            clearOtpFields('email-otp-modal');
            
            userMobileSpan.textContent = currentPhone;
            mobileOtpModal.style.display = 'flex';
            
            // Send OTP to mobile
            const mobileResponse = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: currentPhone,
                    type: 'mobile'
                })
            });

            const mobileData = await mobileResponse.json();

            if (!mobileResponse.ok) {
                throw new Error(mobileData.error || 'Failed to send mobile OTP');
            }
        } catch (error) {
            console.error('Verification Error:', error);
            alert(error.message);
        }
    });
    
    verifyMobileOtpBtn.addEventListener('click', async function() {
        const otp = getEnteredOtp('mobile-otp-modal');
        
        try {
            const response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: currentPhone,
                    otp,
                    type: 'mobile'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Mobile verified, complete registration
            mobileOtpModal.style.display = 'none';
            clearOtpFields('mobile-otp-modal');
            
            const name = document.getElementById('signup-name').value;
            const password = document.getElementById('signup-password').value;
            
            const registerResponse = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email: currentEmail,
                    phone: currentPhone,
                    password,
                    role: currentRole
                })
            });

            const registerData = await registerResponse.json();

            if (!registerResponse.ok) {
                throw new Error(registerData.error || 'Registration failed');
            }

            // Registration successful, store token and redirect
            localStorage.setItem('token', registerData.token);
            if (currentRole === 'user') {
                window.location.href = '../dashboard.html';
            } else {
                window.location.href = '../technician-dashboard.html';
            }
        } catch (error) {
            console.error('Registration Error:', error);
            alert(error.message);
        }
    });
    
    // Resend OTP
    resendEmailOtpBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: currentEmail,
                    type: 'email'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend OTP');
            }

            alert('New OTP sent to your email!');
        } catch (error) {
            console.error('Resend Error:', error);
            alert(error.message);
        }
    });
    
    resendMobileOtpBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: currentPhone,
                    type: 'mobile'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend OTP');
            }

            alert('New OTP sent to your mobile!');
        } catch (error) {
            console.error('Resend Error:', error);
            alert(error.message);
        }
    });
    
    // Helper Functions
    function getEnteredOtp(modalId) {
        const digits = document.querySelectorAll(`#${modalId} .otp-digit`);
        let otp = '';
        digits.forEach(digit => {
            otp += digit.value;
        });
        return otp;
    }
    
    function clearOtpFields(modalId) {
        const digits = document.querySelectorAll(`#${modalId} .otp-digit`);
        digits.forEach(digit => {
            digit.value = '';
        });
        digits[0].focus();
    }
});