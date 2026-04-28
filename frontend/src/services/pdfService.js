import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a premium multi-page health report PDF.
 * Page 1: Diagnostic data and risk assessment.
 * Page 2: AI-generated advisory and roadmap.
 */
export const generateHealthReport = async (data) => {
    const {
        userName,
        disease,
        prediction,
        riskLevel,
        probability,
        explanation,
        aiAdvice,
        inputs
    } = data;

    // Create a hidden div for report generation
    const reportDiv = document.createElement('div');
    reportDiv.style.position = 'absolute';
    reportDiv.style.left = '-9999px';
    reportDiv.style.width = '850px';
    reportDiv.style.backgroundColor = '#ffffff';
    reportDiv.style.color = '#0f172a';
    reportDiv.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";

    const riskColor = riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981';
    const riskBg = riskLevel === 'High' ? '#fef2f2' : riskLevel === 'Medium' ? '#fffbeb' : '#f0fdf4';

    reportDiv.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            .pdf-page { width: 850px; padding: 40px; background: #ffffff; position: relative; box-sizing: border-box; }
            .clinical-border { border: 2px solid #e2e8f0; border-radius: 32px; padding: 40px; height: 1060px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
            .accent-bar { position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: #2563eb; }
            .section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
            .section-label::after { content: ''; flex: 1; height: 1px; background: #f1f5f9; }
            .data-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
            .data-node { background: #f8fafc; border: 1px solid #f1f5f9; padding: 12px; border-radius: 12px; }
            .node-label { font-size: 8px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
            .node-value { font-size: 12px; color: #1e293b; font-weight: 800; }
        </style>

        <!-- PAGE 1: DIAGNOSTIC CORE -->
        <div id="page-1" class="pdf-page">
            <div class="clinical-border">
                <div class="accent-bar"></div>
                
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
                    <div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px;">HealthSync <span style="color: #2563eb;">AI</span></h1>
                        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Neural Diagnostic Issuance</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: #0f172a; color: white; padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 700; margin-bottom: 6px;">CONFIDENTIAL</div>
                        <p style="margin: 0; font-size: 9px; color: #94a3b8;">SECURE LOG: HS-${Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                    </div>
                </div>

                <!-- Patient & Risk -->
                <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 35px;">
                    <div style="background: #f8fafc; border-radius: 20px; padding: 25px; border: 1px solid #e2e8f0;">
                        <div class="section-label">Subject Identity</div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #1e293b;">${userName || 'Anonymous Patient'}</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; color: #2563eb; font-weight: 700;">Diagnostic Target: ${disease?.toUpperCase() || 'GENERAL SCAN'}</p>
                    </div>
                    <div style="background: ${riskBg}; border-radius: 20px; padding: 25px; border: 2px solid ${riskColor}40;">
                        <div class="section-label" style="color: ${riskColor}">Risk Profile</div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-size: 24px; font-weight: 950; color: ${riskColor};">${prediction}</span>
                            <span style="font-size: 14px; font-weight: 700; color: #64748b;">(${(probability * 100).toFixed(1)}%)</span>
                        </div>
                        <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 800; color: ${riskColor}; text-transform: uppercase;">${riskLevel} CRITICALITY PROFILE</p>
                    </div>
                </div>

                <!-- Biometrics -->
                <div class="section-label">Clinical Data Points</div>
                <div class="data-grid">
                    ${Object.entries(inputs || {}).map(([key, val]) => `
                        <div class="data-node">
                            <div class="node-label">${key.replace(/_/g, ' ')}</div>
                            <div class="node-value">${val}</div>
                        </div>
                    `).join('')}
                </div>

                <!-- Neural Feature Impact -->
                ${explanation && explanation.length > 0 ? `
                <div class="section-label">Diagnostic Influencers (Neural Weights)</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px;">
                    ${explanation.slice(0, 10).map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px;">
                            <span style="font-size: 10px; font-weight: 700; color: #475569;">${item.feature}</span>
                            <span style="font-size: 11px; font-weight: 900; color: ${item.impact > 0 ? '#ef4444' : '#10b981'};">
                                ${item.impact > 0 ? '↑' : '↓'} ${Math.abs(item.impact).toFixed(2)}
                            </span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Verification Stamp -->
                <div style="margin-top: auto; padding-top: 30px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <div style="max-width: 450px;">
                        <p style="margin: 0; font-size: 9px; color: #94a3b8; line-height: 1.6;">
                            This report is a computational analysis generated by the HealthSync Neural Engine. It serves as a preliminary diagnostic aid and must be reviewed by a certified medical professional before clinical action.
                        </p>
                    </div>
                    <div style="text-align: right; border-left: 3px solid #2563eb; padding-left: 15px;">
                        <p style="margin: 0; font-size: 11px; font-weight: 900; color: #1e293b; text-transform: uppercase;">AUTHENTICATED</p>
                        <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">NODE-ID: HS-PRD-01</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- PAGE 2: AI ADVISORY & STRATEGY -->
        <div id="page-2" class="pdf-page">
            <div class="clinical-border" style="padding: 25px; height: 1060px;">
                <div class="accent-bar" style="background: #0f172a;"></div>
                
                <div style="margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">Clinical Advisory Roadmap</h1>
                    <p style="margin: 2px 0 0 0; color: #64748b; font-size: 8.5px; font-weight: 600; text-transform: uppercase;">AI-Generated Consultation & Intervention Plan</p>
                </div>

                <!-- Combined AI Content -->
                <div style="display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0; overflow: hidden;">
                    <!-- Quick Clinical Advisory -->
                    ${aiAdvice?.quick && !aiAdvice.quick.includes('Generating') ? `
                    <div style="background: #0f172a; color: #ffffff; border-radius: 16px; padding: 15px; position: relative;">
                        <div class="section-label" style="color: #38bdf8; border-bottom: 1px solid rgba(56, 189, 248, 0.1); padding-bottom: 6px; margin-bottom: 10px; font-size: 8.5px;">Primary AI Consultation</div>
                        <div style="font-size: 10px; line-height: 1.5; color: #e2e8f0; font-weight: 400;">
                            ${aiAdvice.quick}
                        </div>
                    </div>
                    ` : ''}

                    <!-- 90-Day Strategy Roadmap -->
                    ${aiAdvice?.detailed && !aiAdvice.detailed.includes('pending') ? `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; flex: 1; min-height: 0; display: flex; flex-direction: column;">
                        <div class="section-label" style="margin-bottom: 10px; font-size: 8.5px;">Strategic Intervention Plan (90 Days)</div>
                        <div style="font-size: 10px; line-height: 1.4; color: #334155; white-space: pre-wrap; font-weight: 500; overflow: hidden;">
                            ${aiAdvice.detailed}
                        </div>
                    </div>
                    ` : `
                    <div style="background: #f1f5f9; border-radius: 16px; padding: 15px; flex: 1; display: flex; align-items: center; justify-content: center; color: #94a3b8;">
                        <p style="font-size: 11px; font-weight: 500;">Roadmap processing or pending clinical validation...</p>
                    </div>
                    `}
                </div>

                <!-- Disclaimer -->
                <div style="margin-top: 15px; padding: 12px; background: #fef2f2; border: 1px solid #ef444415; border-radius: 12px; display: flex; gap: 10px; align-items: flex-start;">
                    <div style="background: #ef4444; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 10px; flex-shrink: 0;">!</div>
                    <p style="margin: 0; font-size: 8.5px; color: #991b1b; line-height: 1.4; font-weight: 500;">
                        <b>Clinical Notice:</b> The advice provided on this page is neurally generated and based on data patterns. It does not replace professional medical judgment. Implementation of this strategy should be monitored by a healthcare provider.
                    </p>
                </div>
            </div>
        </div>


    `;

    document.body.appendChild(reportDiv);

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const timestamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const reportId = `HS-ID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Determine if Page 2 should be included
        const hasQuickAdvice = aiAdvice?.quick && !aiAdvice.quick.toLowerCase().includes('generating');
        const hasDetailedAdvice = aiAdvice?.detailed && !aiAdvice.detailed.toLowerCase().includes('pending') && !aiAdvice.detailed.toLowerCase().includes('processing');
        const hasAdvice = hasQuickAdvice || hasDetailedAdvice;
        const totalPages = hasAdvice ? 2 : 1;

        const addFooter = (pageNum) => {
            pdf.setPage(pageNum);
            pdf.setFillColor(248, 250, 252);
            pdf.rect(0, 287, 210, 10, 'F');
            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(7);
            pdf.text(`HealthSync AI Diagnostic Node | Report ID: ${reportId} | Issued: ${timestamp} | Page ${pageNum} of ${totalPages}`, 105, 294, { align: 'center' });
        };

        // Capture Page 1
        const canvas1 = await html2canvas(document.getElementById('page-1'), { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
        pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
        addFooter(1);

        // Capture Page 2 ONLY if advice exists
        if (hasAdvice) {
            pdf.addPage();
            const canvas2 = await html2canvas(document.getElementById('page-2'), { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
            pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
            addFooter(2);
        }

        const timeId = new Date().getTime();
        pdf.save(`HealthSync_Report_${disease}_${userName || 'Patient'}_${timeId}.pdf`);
    } catch (err) {
        console.error("PDF Generation Critical Failure", err);
    }
    finally {
        if (document.body.contains(reportDiv)) {
            document.body.removeChild(reportDiv);
        }
    }
};

/**
 * Basic PDF export for dashboard elements.
 */
export const exportToPDF = async (elementId, filename = 'health-report.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const timestamp = new Date().getTime();
    const finalFilename = filename.includes('.pdf') ? filename.replace('.pdf', `-${timestamp}.pdf`) : `${filename}-${timestamp}.pdf`;
    pdf.save(finalFilename);
};
