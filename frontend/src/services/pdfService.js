import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateHealthReport = async (data) => {
    const { 
        userName, 
        disease, 
        prediction, 
        riskLevel, 
        probability, 
        explanation, 
        aiAdvice, // Now an object: { quick, detailed }
        inputs 
    } = data;

    // Create a hidden div for report generation
    const reportDiv = document.createElement('div');
    reportDiv.style.position = 'absolute';
    reportDiv.style.left = '-9999px';
    reportDiv.style.width = '800px';
    reportDiv.style.padding = '40px';
    reportDiv.style.backgroundColor = '#ffffff';
    reportDiv.style.color = '#1e293b';
    reportDiv.style.fontFamily = "'Inter', sans-serif";

    reportDiv.innerHTML = `
        <style>
            .pdf-page { width: 800px; padding: 40px; background: #ffffff; position: relative; margin-bottom: 20px; }
            .clinical-box { border-radius: 40px; padding: 40px; margin-bottom: 30px; position: relative; overflow: hidden; }
            .dark-box { background: #0f172a; color: #ffffff; box-shadow: 0 25px 30px -10px rgba(0, 0, 0, 0.2); border: 1px solid #1e293b; }
            .light-box { background: #f8fafc; border: 2px solid #e2e8f0; }
        </style>

        <!-- PAGE 1: PRIMARY DIAGNOSTIC ISSUANCE -->
        <div id="page-1" class="pdf-page">
            <div style="border: 2px solid #2463eb; padding: 40px; border-radius: 45px; height: 1040px; box-sizing: border-box; display: flex; flex-direction: column;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 4px solid #2463eb; padding-bottom: 30px; margin-bottom: 40px;">
                    <div>
                        <h1 style="margin: 0; color: #1e1b4b; text-transform: uppercase; font-size: 32px; font-weight: 950; letter-spacing: -1px;">Clinical Intelligence Node</h1>
                        <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase;">Enterprise Neural Diagnostic Report</p>
                    </div>
                </div>

                <!-- Patient & Result -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
                    <div style="background: #f8fafc; padding: 25px; border-radius: 25px; border: 1px solid #e2e8f0;">
                        <h3 style="margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 900;">Subject Identity</h3>
                        <p style="margin: 5px 0; font-size: 20px; font-weight: 950; color: #1e293b;">${userName || 'Anonymous Patient'}</p>
                        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #2463eb;">Target: ${disease?.toUpperCase()}</p>
                    </div>
                    <div style="background: ${riskLevel === 'High' ? '#fef2f2' : riskLevel === 'Medium' ? '#fffbeb' : '#f0fdf4'}; padding: 25px; border-radius: 25px; border: 2px solid ${riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981'};">
                        <h3 style="margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 900;">Neural Probability</h3>
                        <div style="display: flex; align-items: baseline; gap: 8px;">
                            <p style="margin: 0; font-size: 24px; font-weight: 950; color: ${riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#d97706' : '#059669'};">${prediction}</p>
                            <p style="margin: 0; font-size: 14px; font-weight: 900; color: #64748b;">(${(probability * 100).toFixed(1)}%)</p>
                        </div>
                        <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 900;">${riskLevel.toUpperCase()} RISK PROFILE</p>
                    </div>
                </div>

                <!-- Biometrics -->
                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #1e293b; font-weight: 950; border-left: 5px solid #2463eb; padding-left: 15px;">Biometric Data Points</h3>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                        ${Object.entries(inputs || {}).map(([key, val]) => `
                            <div style="padding: 10px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; text-align: center;">
                                <p style="margin: 0; font-size: 8px; color: #94a3b8; font-weight: 950; text-transform: uppercase;">${key}</p>
                                <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 900; color: #1e293b;">${val}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Neural Interpretations (Feature Impact) -->
                ${explanation && explanation.length > 0 ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #1e293b; font-weight: 950; border-left: 5px solid #10b981; padding-left: 15px;">Diagnostic Interpretations</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        ${explanation.slice(0, 6).map(item => `
                            <div style="padding: 12px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase;">${item.feature}</span>
                                <span style="font-size: 10px; font-weight: 950; color: ${item.impact > 0 ? '#2463eb' : '#10b981'};">
                                    ${item.impact > 0 ? '+' : ''}${item.impact.toFixed(2)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Quick Advice -->
                ${aiAdvice?.quick && !aiAdvice.quick.includes('Generating') ? `
                 <div class="clinical-box dark-box" style="flex: 1; min-height: 0; overflow: hidden; margin-bottom: 15px; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 10px; height: 10px; background: #38bdf8; border-radius: 2px; transform: rotate(45deg);"></div>
                        <h3 style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #38bdf8; font-weight: 950;">Clinical Quick Advisory</h3>
                    </div>
                    <div style="font-size: 10.5px; line-height: 1.6; color: #e2e8f0; font-weight: 500;">
                        ${aiAdvice.quick.substring(0, 800)}${aiAdvice.quick.length > 800 ? '...' : ''}
                    </div>
                </div>
                ` : ''}

                <div style="margin-top: auto; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
                    <p style="font-size: 9px; color: #cbd5e1; line-height: 1.5;">This report contains high-priority screening data and requires clinical validation.</p>
                </div>
            </div>
        </div>

        <!-- PAGE 2: SECONDARY STRATEGIC ROADMAP -->
        <div id="page-2" class="pdf-page">
            <div style="border: 2px solid #2463eb; padding: 40px; border-radius: 45px; height: 1040px; box-sizing: border-box; display: flex; flex-direction: column;">
                 <h1 style="margin: 0 0 40px 0; color: #1e1b4b; text-transform: uppercase; font-size: 24px; font-weight: 950; border-bottom: 4px solid #2463eb; padding-bottom: 20px;">90-Day Clinical Strategy</h1>
                 
                 ${aiAdvice?.detailed && !aiAdvice.detailed.includes('pending') ? `
                 <div class="clinical-box light-box" style="flex: 1; min-height: 0; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; width: 10px; height: 100%; background: #2463eb;"></div>
                    <div style="font-size: 11.5px; line-height: 1.6; color: #334155; white-space: pre-wrap; font-weight: 500;">
                        ${aiAdvice.detailed}
                    </div>
                 </div>
                 ` : ''}

                 <div style="margin-top: auto; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                    <p style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Clinical Validation Required</p>
                    <p style="font-size: 9px; color: #cbd5e1; margin-top: 10px; line-height: 1.5;">This neurally generated diagnostic blueprint must be reviewed by a licensed medical professional prior to treatment initialization.</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(reportDiv);

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const timestamp = new Date().toLocaleDateString();
        const reportId = `#AI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const addBordersAndHeader = (pageNum) => {
            pdf.setPage(pageNum);
            pdf.setFillColor(36, 99, 235);
            pdf.rect(0, 0, 210, 15, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.text("CLINICAL INTELLIGENCE NODE - ENTERPRISE DIAGNOSTIC ISSUANCE", 10, 10);
            pdf.text(`PAGE ${pageNum} of 2`, 180, 10);
            pdf.setFillColor(248, 250, 252);
            pdf.rect(0, 287, 210, 10, 'F');
            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(7);
            pdf.text(`ISSUED: ${timestamp} | SECURE NODE ID: ${reportId} | Clinical Validation Required`, 105, 294, { align: 'center' });
        };

        // Capture Page 1
        const canvas1 = await html2canvas(document.getElementById('page-1'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 15, 210, 272);
        addBordersAndHeader(1);

        // Capture Page 2 if needed
        if (aiAdvice?.detailed && !aiAdvice.detailed.includes('pending')) {
            pdf.addPage();
            const canvas2 = await html2canvas(document.getElementById('page-2'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 15, 210, 272);
            addBordersAndHeader(2);
        }

        const timeId = new Date().getTime();
        pdf.save(`Report-${disease}-${userName || 'Patient'}-${timeId}.pdf`);
    } catch (err) {
        console.error("PDF Generation Critical Failure", err);
    } finally {
        if (document.body.contains(reportDiv)) {
            document.body.removeChild(reportDiv);
        }
    }
};

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
