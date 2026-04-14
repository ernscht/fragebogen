Qualtrics.SurveyEngine.addOnReady(function() {
    /******************************************************************
     * iMpuls Result-Page – Visual Risk Dashboard
     * Logic: RISK_SCORE (0, 1, 2, 3, 4) determines the needle position.
     ******************************************************************/

        // 1) Pull the Risk Score from Embedded Data
    var riskScore = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('RISK_SCORE'));
    // BMI anzeigen
    var bmiValue = Qualtrics.SurveyEngine.getEmbeddedData('BMI');
    var bmiClass = Qualtrics.SurveyEngine.getEmbeddedData('BMI_CLASSIFICATION');

// Optional: Mapping für sprechende Klassifikation
    var bmiClassLabels = {
        "NORMALWEIGHT": "Normalgewicht",
        "OVERWEIGHT": "Übergewicht",
        "ADIPOSITAS_1": "Adipositas Grad I",
        "ADIPOSITAS_2": "Adipositas Grad II",
        "ADIPOSITAS_3": "Adipositas Grad III",
    };

    var bmiDisplay = document.getElementById("displayBMIValue");
    if (bmiDisplay && bmiValue) {
        bmiDisplay.innerText = bmiValue;
    }

    var bmiClassDisplay = document.getElementById("displayBMIClass");
    if (bmiClassDisplay && bmiClass) {
        var label = bmiClassLabels[bmiClass] || bmiClass;
        bmiClassDisplay.innerText = "Dein BMI deutet auf " + label + " hin";
    }


    // Fallback if the variable is missing or NaN
    if (isNaN(riskScore)) { riskScore = 0; }

    // Ensure score stays within 0-4 range
    var clampedScore = Math.max(0, Math.min(4, riskScore));

    // 2) Configuration: Colors and Labels for the 5 levels
    var riskConfig = {
        0: { label: "Kein Risiko", color: "#27ae60" },      // Green
        1: { label: "Geringes Risiko", color: "#99cc33" },   // Light Green
        2: { label: "Mittleres Risiko", color: "#f1c40f" },  // Yellow
        3: { label: "Hohes Risiko", color: "#e67e22" },      // Orange
        4: { label: "Sehr hohes Risiko", color: "#c0392b" }  // Red
    };

    // 3) Show the corresponding Content Block
    // (Assumes .result-block { display: none; } is in Custom CSS)
    var riskKeys = ["ZERO", "ONE", "TWO", "THREE", "FOUR"];
    var currentId = 'RISK_' + riskKeys[clampedScore];
    var contentEl = document.getElementById(currentId);
    if (contentEl) { contentEl.style.display = 'block'; }

    // 4) Draw the Tachometer (Canvas)
    var canvas = document.getElementById("risk_dashboard_canvas");
    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext("2d");

        // Canvas dimensions
        var centerX = canvas.width / 2;
        var centerY = canvas.height - 30;
        var radius = Math.min(centerX, centerY) - 20;

        // Clear previous drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);


        // CUSTOM START
        function degToRad(deg) {
            return (deg * Math.PI) / 180;
        }

        function drawRingSegment(centerX, centerY, outerR, innerR, startDeg, endDeg, color) {
            const start = degToRad(startDeg);
            const end = degToRad(endDeg);

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerR, start, end, false);
            ctx.arc(centerX, centerY, innerR, end, start, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        function drawTachometer() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height * 0.92;
            const outerR = Math.min(canvas.width * 0.46, canvas.height * 0.85);
            const innerR = outerR * 0.64;

            const gap = 3.5;
            const segments = [
                { start: 180, end: 198, color: '#00961a' },
                { start: 198 + gap, end: 213, color: '#50bb4a' },
                { start: 213 + gap, end: 235, color: '#86c64e' },
                { start: 235 + gap, end: 265, color: '#f4b533' },
                { start: 265 + gap, end: 360, color: '#ff5730' }
            ];

            segments.forEach(seg => {
                drawRingSegment(centerX, centerY, outerR, innerR, seg.start, seg.end, seg.color);
            });

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerR + 6, Math.PI, 0, false);
            ctx.lineWidth = 14;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        }

        drawTachometer();

        // CUSTOM END

        /*
        // Draw the 5 segments (0 to 4)
        [0, 1, 2, 3, 4].forEach(function(i) {
          // Each segment is 1/5th of the semi-circle (PI / 5)
          var startAngle = Math.PI + (i * (Math.PI / 5));
          var endAngle = Math.PI + ((i + 1) * (Math.PI / 5));

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
          ctx.lineWidth = 30;
          ctx.strokeStyle = riskConfig[i].color;
          ctx.stroke();
        });
        */


        // Calculate Needle Angle
        // Math.PI is the start (left), we add (score * segmentWidth)
        // + half a segment to point to the middle of the color block
        var segmentWidth = Math.PI / 5;
        var needleAngle = Math.PI + (clampedScore * segmentWidth) + (segmentWidth / 2);

        // Draw the Needle
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(needleAngle);

        ctx.beginPath();
        ctx.moveTo(0, -6);          // Needle base width
        ctx.lineTo(radius - 15, 0); // Needle length
        ctx.lineTo(0, 6);
        ctx.fillStyle = "#333333";
        ctx.fill();

        // Draw Center Pivot Point
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        // 5) Update the Text Label below the Gauge
        var labelEl = document.getElementById("displayRiskLevelLabel");
        if (labelEl) {
            labelEl.innerText = riskConfig[clampedScore].label;
            labelEl.style.color = riskConfig[clampedScore].color;
        }
    }
});
