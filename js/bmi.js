Qualtrics.SurveyEngine.addOnReady(function () {
    /******************************************************************
     * iMpuls Result-Page – Visual Risk Dashboard (multilingual)
     * Language detection html lang attribute (default / fallback: German)
     ******************************************************************/

    /* ================================================================
       1) Detect language
       ================================================================ */
    var lang = (document.documentElement.lang || "de").toLowerCase();
    if (lang.indexOf("fr") === 0) {
        lang = "fr";
    } else if (lang.indexOf("it") === 0) {
        lang = "it";
    } else {
        lang = "de";
    }

    /* ================================================================
       2) Translation dictionary
       ================================================================ */
    var i18n = {
        de: {
            riskLabels: {
                0: "Kein Risiko",
                1: "Geringes Risiko",
                2: "Mittleres Risiko",
                3: "Hohes Risiko",
                4: "Sehr hohes Risiko"
            },
            bmiPrefix: "Dein BMI deutet auf ",
            bmiClasses: {
                "NORMALWEIGHT": "Normalgewicht",
                "OVERWEIGHT": "Übergewicht",
                "ADIPOSITAS_1": "Adipositas Grad I",
                "ADIPOSITAS_2": "Adipositas Grad II",
                "ADIPOSITAS_3": "Adipositas Grad III"
            }
        },

        fr: {
            riskLabels: {
                0: "Aucun risque",
                1: "Risque faible",
                2: "Risque modéré",
                3: "Risque élevé",
                4: "Risque très élevé"
            },
            bmiPrefix: "Votre IMC indique ",
            bmiClasses: {
                "NORMALWEIGHT": "poids normal",
                "OVERWEIGHT": "surpoids",
                "ADIPOSITAS_1": "obésité de degré I",
                "ADIPOSITAS_2": "obésité de degré II",
                "ADIPOSITAS_3": "obésité de degré III"
            }
        },

        it: {
            riskLabels: {
                0: "Nessun rischio",
                1: "Rischio basso",
                2: "Rischio medio",
                3: "Rischio alto",
                4: "Rischio molto alto"
            },
            bmiPrefix: "Il tuo BMI indica ",
            bmiClasses: {
                "NORMALWEIGHT": "peso normale",
                "OVERWEIGHT": "sovrappeso",
                "ADIPOSITAS_1": "obesità di grado I",
                "ADIPOSITAS_2": "obesità di grado II",
                "ADIPOSITAS_3": "obesità di grado III"
            }
        }
    };

    var t = i18n[lang];

    /* ================================================================
       3) Get Embedded Data
       ================================================================ */
    var riskScore = parseInt(Qualtrics.SurveyEngine.getEmbeddedData("RISK_SCORE"));
    if (isNaN(riskScore)) { riskScore = 0; }
    var clampedScore = Math.max(0, Math.min(4, riskScore));

    var bmiValue = Qualtrics.SurveyEngine.getEmbeddedData("BMI");
    var bmiClass = Qualtrics.SurveyEngine.getEmbeddedData("BMI_CLASSIFICATION");

    /* ================================================================
       4) Display BMI information
       ================================================================ */
    var bmiDisplay = document.getElementById("displayBMIValue");
    if (bmiDisplay && bmiValue) {
        bmiDisplay.innerText = bmiValue;
    }

    var bmiClassDisplay = document.getElementById("displayBMIClass");
    if (bmiClassDisplay && bmiClass) {
        var bmiLabel = t.bmiClasses[bmiClass] || bmiClass;
        bmiClassDisplay.innerText = t.bmiPrefix + bmiLabel;
    }

    /* ================================================================
       5) Risk configuration (colors stay language-independent)
       ================================================================ */
    var riskConfig = {
        0: { label: t.riskLabels[0], color: "#00881d" }, // Green
        1: { label: t.riskLabels[1], color: "#4aba4d" }, // Middle Green
        2: { label: t.riskLabels[2], color: "#85ca51" }, // Light Green
        3: { label: t.riskLabels[3], color: "#fdb931" }, // Orange
        4: { label: t.riskLabels[4], color: "#fd5431" }  // Red
    };

    /* ================================================================
       6) Show corresponding content block
       ================================================================ */
    var riskKeys = ["ZERO", "ONE", "TWO", "THREE", "FOUR"];
    var currentId = "RISK_" + riskKeys[clampedScore];
    var contentEl = document.getElementById(currentId);
    if (contentEl) {
        contentEl.style.display = "block";
    }

    /* ================================================================
       7) Draw tachometer (Canvas)
       ================================================================ */
    var canvas = document.getElementById("risk_dashboard_canvas");
    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext("2d");

        // Canvas dimensions (place gauge toward the top, leave bottom space)
        var centerX = canvas.width / 2;
        var topPadding = 80;
        var bottomPadding = 40;
        var availableHeight = canvas.height - topPadding - bottomPadding;
        var radius = Math.min(canvas.width * 0.46, availableHeight) - 6;
        var centerY = topPadding + radius;

        // Clear previous drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // CUSTOM START
        function degToRad(deg) {
            return (deg * Math.PI) / 180;
        }

        function drawRingSegment(centerX, centerY, outerR, innerR, startDeg, endDeg, color, strokeColor) {
            const start = degToRad(startDeg);
            const end = degToRad(endDeg);

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerR, start, end, false);
            ctx.arc(centerX, centerY, innerR, end, start, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            if (strokeColor) {
                ctx.lineWidth = 6;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            }
        }

        function drawTachometer() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = topPadding + radius;
            const outerR = radius;
            const innerR = outerR * 0.64;

            const gap = 3.5;
            const colors = ['#00961a', '#50bb4a', '#86c64e', '#f4b533', '#ff5730'];
            const totalSpan = 180;
            const totalGap = gap * (colors.length - 1);
            const segmentSpan = (totalSpan - totalGap) / colors.length;
            let start = 180;
            const segments = colors.map(color => {
                const end = start + segmentSpan;
                const seg = { start: start, end: end, color: color };
                start = end + gap;
                return seg;
            });

            // White backing ring behind the colored arc (8px on all sides)
            drawRingSegment(
                centerX,
                centerY,
                outerR + 24,
                innerR - 24,
                180,
                360,
                '#ffffff',
                '#ffffff'
            );

            segments.forEach(seg => {
                drawRingSegment(centerX, centerY, outerR, innerR, seg.start, seg.end, seg.color);
            });
        }

        drawTachometer();

        // Calculate Needle Angle
        // Math.PI is the start (left), we add (score * segmentWidth)
        // + half a segment to point to the middle of the color block
        var segmentWidth = Math.PI / 5;
        var needleAngle = Math.PI + (clampedScore * segmentWidth) + (segmentWidth / 2);

        // Draw the Needle (SVG-based)
        ctx.save();
        ctx.translate(centerX, centerY);
        // SVG needle points "up" by default; rotate +90° to align with +X direction
        ctx.rotate(needleAngle + Math.PI / 2);

        // SVG reference: viewBox="0 0 62 106"
        // Base center (pivot) is roughly at x=31, y=95. Tip at y=12.4.
        var needleTipY = 12.4;
        var needleBaseY = 95.0;
        var needleBaseX = 31.0;
        var needleBaseToTip = needleBaseY - needleTipY; // ~82.6

        // Shorter than before: 55% of radius
        var needleLength = radius * 0.55;
        var needleScale = needleLength / needleBaseToTip;

        ctx.scale(needleScale, needleScale);
        // Move pivot inward by ~1/5 of needle length
        var pivotInset = needleBaseToTip / 5;
        ctx.translate(-needleBaseX, -(needleBaseY - pivotInset));

        var needleOuter = new Path2D(
            "M26.3,12.4c1.1-5.2,8.4-5.2,9.5,0,5.2,23.4,12.7,58.9,12.7,67.9,0,13.8-10.3,14.8-17.5,14.8s-17.5-3-17.5-14.8c0-7.8,7.6-44.1,12.8-67.9Z"
        );
        var needleInner = new Path2D(
            "M45,80.3c0-2-.4-5.6-1.2-10.6-.8-4.9-1.9-10.9-3.1-17.3-2.5-12.9-5.7-27.6-8.3-39.2-.3-1.5-2.4-1.5-2.7,0-2.6,11.9-5.8,26.9-8.3,39.9-1.3,6.5-2.4,12.5-3.2,17.3-.8,4.9-1.2,8.4-1.2,10,0,4.7,1.9,7.3,4.5,8.9,2.7,1.7,6.4,2.4,9.5,2.4s7.1-.3,9.7-1.8c1.2-.7,2.2-1.7,3-3,.8-1.4,1.3-3.5,1.3-6.5ZM52,80.3c0,3.9-.7,7.1-2.1,9.8-1.4,2.7-3.4,4.6-5.7,5.8-4.4,2.5-9.6,2.7-13.2,2.7s-9.1-.8-13.3-3.5c-4.5-2.9-7.7-7.7-7.7-14.8,0-2.3.5-6.3,1.3-11.1.8-4.9,1.9-11,3.2-17.5,2.6-13.1,5.8-28.1,8.4-40,1.9-8.9,14.4-8.9,16.4,0,2.6,11.7,5.8,26.4,8.3,39.4,1.3,6.5,2.4,12.5,3.2,17.6.8,4.9,1.3,9.1,1.3,11.7Z"
        );

        ctx.fillStyle = "#0099a6";
        ctx.fill(needleOuter);
        ctx.fillStyle = "#ffffff";
        ctx.fill(needleInner);

        ctx.restore();
    }


    /* ================================================================
       8) Update the Text Label below the Gauge
       ================================================================ */
    var labelEl = document.getElementById("displayRiskLevelLabel");
    if (labelEl) {
        labelEl.innerText = riskConfig[clampedScore].label;
        labelEl.style.color = riskConfig[clampedScore].color;
    }

});
