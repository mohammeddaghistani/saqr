const SS = SpreadsheetApp.getActiveSpreadsheet();

// دالة GET للتحقق وجلب الإحصائيات (لتجنب مشاكل CORS)
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "verifyOTP") {
    const empID = e.parameter.empID;
    const sheet = SS.getSheetByName("Users");
    const rows = sheet.getDataRange().getValues();
    
    for (let i = 1; i < rows.length; i++) {
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

  if (action === "getStats") {
    const records = SS.getSheetByName("Records").getDataRange().getValues();
    let total = 0, list = [];
    for (let i = 1; i < records.length; i++) {
      total += parseFloat(records[i][5]) || 0;
      list.push({id:records[i][0], emp:records[i][3], cat:records[i][4], amt:records[i][5], status:records[i][6]});
    }
    return response(true, "نجاح", { total: total.toLocaleString(), recentRecords: list.reverse() });
  }
}

// دالة POST لإضافة البيانات
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "addRecord") {
      const sheet = SS.getSheetByName("Records");
      const orderID = "SAQR-" + (sheet.getLastRow() + 1000);
      sheet.appendRow([orderID, new Date(), data.empID, data.empName, data.category, parseFloat(data.amount)||0, "Pending", data.notes]);
      return response(true, "تم الحفظ", { orderID: orderID });
    }
  } catch (err) { return response(false, "خطأ في السيرفر"); }
}

function response(s, m, d = {}) {
  const res = JSON.stringify({success: s, msg: m, data: d});
  return ContentService.createTextOutput(res).setMimeType(ContentService.MimeType.JSON);
}
