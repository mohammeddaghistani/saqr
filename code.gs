const SS = SpreadsheetApp.getActiveSpreadsheet();

// دالة لمعالجة جميع أنواع الطلبات (GET & POST) لضمان عبور البيانات
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const action = e.parameter.action || (e.postData ? JSON.parse(e.postData.contents).action : null);
  const empID = e.parameter.empID || (e.postData ? JSON.parse(e.postData.contents).empID : null);

  if (action === "verifyOTP") {
    const sheet = SS.getSheetByName("Users");
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      // التحقق من الرقم الوظيفي بدقة مع تجاهل المسافات
      if (rows[i][0].toString().trim() === empID.toString().trim()) {
        const user = { 
          name: rows[i][1], 
          role: rows[i][4].toString().toLowerCase().trim(), 
          status: rows[i][5].toString().toLowerCase().trim() 
        };
        if (user.status !== "active") return response(false, "الحساب معلق");
        return response(true, "تم التحقق", user);
      }
    }
    return response(false, "الرقم الوظيفي غير مسجل");
  }
  
  // لجلب الإحصائيات في لوحة التحكم
  if (action === "getStats") {
    const records = SS.getSheetByName("Records").getDataRange().getValues();
    let total = 0;
    for (let i = 1; i < records.length; i++) { total += parseFloat(records[i][5]) || 0; }
    return response(true, "نجاح", { total: total.toLocaleString() });
  }

  return response(false, "إجراء غير معروف");
}

function response(s, m, d = {}) {
  const res = JSON.stringify({success: s, msg: m, data: d});
  return ContentService.createTextOutput(res).setMimeType(ContentService.MimeType.JSON);
}
