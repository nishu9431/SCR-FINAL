document.addEventListener("DOMContentLoaded", () => {
    const createAccountBtn = document.getElementById("createAccountBtn");
  
    createAccountBtn.addEventListener("click", () => {
      const name = document.getElementById("fullName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const pass = document.getElementById("signupPassword").value;
      const confirm = document.getElementById("confirmPassword").value;
  
      // Basic front-end validation
      if (!name || !email || !pass || !confirm) {
        showError("Please fill all fields.");
        return;
      }
  
      if (!validateEmail(email)) {
        showError("Enter a valid email address.");
        return;
      }
  
      if (pass.length < 8) {
        showError("Password must be at least 8 characters.");
        return;
      }
  
      if (pass !== confirm) {
        showError("Passwords do not match.");
        return;
      }
  
      console.log("Attempting registration with:", { email, name, role: "driver" });
  
      // Call backend registration API
      fetch("http://localhost:8000/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: pass,
          name: name,
          role: "driver"  // Default role for new signups
        })
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { 
            console.error("Registration error:", err);
            throw err; 
          });
        }
        return res.json();
      })
      .then(data => {
        console.log("Registration successful:", data);
        alert("Account created successfully! Please login.");
        window.location.href = "Login_page.html";
      })
      .catch(error => {
        console.error("Registration catch error:", error);
        console.error("Error type:", typeof error);
        console.error("Error keys:", Object.keys(error || {}));
        
        let errorMsg = "Registration failed. Please try again.";
        
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMsg = "Network error. Please check if the backend is running.";
        }
        // Handle different error formats
        else if (error.detail) {
          if (Array.isArray(error.detail)) {
            // Pydantic validation errors
            errorMsg = error.detail.map(e => e.msg).join(", ");
          } else if (typeof error.detail === 'string') {
            errorMsg = error.detail;
          }
        }
        
        showError(errorMsg);
      });
    });
  
    // helper functions
    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  
    function showError(msg) {
      // For now we use alert. If you want inline styled errors, I can add that.
      alert(msg);
    }
  });
  