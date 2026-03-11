from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.utils import secure_filename
import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

app = Flask(__name__, static_url_path="/static")
app.secret_key = "supersecretkey"

UPLOAD_FOLDER = "static/uploads"
MODEL_PATH = "model.h5"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load model
try:
    model = load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

CLASS_NAMES = ["Glioma", "Meningioma", "No Tumor", "Pituitary"]

# -------------------- ROUTES --------------------

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/signin", methods=["GET", "POST"])
def signin():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        if email == "user@example.com" and password == "password":
            session["user"] = email
            flash("Login successful!", "success")
            return redirect(url_for("patient-info"))  # Redirecting to patient info page
        else:
            flash("Invalid credentials. Try again!", "danger")
    return render_template("Signin1.html")

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if session.get("doctor_submitted") is None:
        return redirect(url_for("doctorinfo"))  # Doctor info mandatory before signup

    if request.method == "POST":
        # Process signup form
        session.pop("doctor_submitted", None)  # Remove doctor session flag
        flash("Signup successful! Please login.", "success")
        return redirect(url_for("signin"))  # Redirect to signin after signup

    return render_template("signup.html")

@app.route("/doctorinfo", methods=["GET", "POST"])
def doctorinfo():
    if request.method == "POST":
        name = request.form["name"]
        license_number = request.form["license"]
        phone = request.form["phone"]
        email = request.form["email"]

        # Handle file uploads
        if "photo" in request.files and "signature" in request.files:
            photo = request.files["photo"]
            signature = request.files["signature"]
            if photo.filename and signature.filename:
                photo.save(os.path.join(UPLOAD_FOLDER, secure_filename(photo.filename)))
                signature.save(os.path.join(UPLOAD_FOLDER, secure_filename(signature.filename)))

        session["doctor_submitted"] = True  # Mark doctor info as submitted
        flash("Doctor information submitted successfully!", "success")
        return redirect(url_for("signup"))  # Redirect to signup after doctor info

    return render_template("Doctorinfo.html")


@app.route("/patient-info", methods=["GET", "POST"])
def patient_info():
    if request.method == "POST":
        flash("Patient info submitted successfully!", "success")
        return redirect(url_for("analyze"))  # ✅ Redirecting to /analyze after form submission

    return render_template("Patient-info.html")

@app.route("/more-info")
def more_info():
    return render_template("MoreInfo.html")

@app.route("/login")
def login():
    return render_template("Signin1.html")

@app.route("/forgot-password")
def forgot_password():
    return render_template("forgot-Password.html")





# -------------------- IMAGE UPLOAD & ANALYSIS --------------------

@app.route('/analyze', methods=['GET', 'POST'])
def analyze():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash("No file uploaded!", "danger")
            return redirect(request.url)

        file = request.files['file']
        if file.filename == '':
            flash("No selected file!", "danger")
            return redirect(request.url)

        filepath = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
        file.save(filepath)

        prediction = predict_tumor(filepath)
        print(f"✅ Prediction: {prediction}")

        return render_template('input-img.html', result=prediction[0], confidence=prediction[1], file=filepath)

    return render_template('input-img.html')

# -------------------- IMAGE PROCESSING & PREDICTION --------------------

def predict_tumor(img_path):
    try:
        img = image.load_img(img_path, target_size=(128, 128))  
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)  
        img_array = img_array / 255.0  

        predictions = model.predict(img_array)
        predicted_class = CLASS_NAMES[np.argmax(predictions)]  
        confidence = round(np.max(predictions) * 100, 2)

        return predicted_class, confidence

    except Exception as e:
        print(f"❌ Prediction Error: {e}")
        return "Error processing image.", 0

@app.route("/logout")
def logout():
    session.pop("user", None)
    flash("You have been logged out.", "info")
    return redirect(url_for("home"))

if __name__ == "__main__":
    app.run(debug=True)
