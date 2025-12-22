const SS = SpreadsheetApp.getActiveSpreadsheet();

// دالة GET للتحقق من الدخول وجلب البيانات (الأفضل لـ GitHub)
function doGet(e) {
  const action = e.parameter.action;
  const empID = e.parameter.empID;

  if (action === "verifyOTP") {
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
    return response(false, "المستخدم غير مسجل");
  }

  if (action === "getStats") {
    const records = SS.getSheetByName("Records").getDataRange().getValues();
    let total = 0;
    for (let i = 1; i < records.length; i++) {
      total += parseFloat(records[i][5]) || 0;
    }
    return response(true, "نجاح", { total: total.toLocaleString() });
  }
}

// دالة POST لإضافة البيانات والبلاغات
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "addRecord") {
      const sheet = SS.getSheetByName("Records");
      const orderID = "SAQR-" + (sheet.getLastRow() + 1000);
      sheet.appendRow([orderID, new Date(), data.empID, data.empName, data.category, parseFloat(data.amount)||0, "Pending", data.notes]);
      return response(true, "تم الحفظ", { orderID: orderID });
    }

    if (action === "sendSupportTicket") {
      const sheet = SS.getSheetByName("Records");
      const ticketID = "TICK-" + Math.floor(Math.random() * 9000 + 1000);
      sheet.appendRow([ticketID, new Date(), data.empID, data.empName, "SUPPORT: " + data.type, 0, "Open", data.description]);
      return response(true, "تم الإرسال", { ticketID: ticketID });
    }
  } catch (err) { return response(false, err.toString()); }
}

function response(s, m, d = {}) {
  const res = JSON.stringify({success: s, msg: m, data: d});
  return ContentService.createTextOutput(res).setMimeType(ContentService.MimeType.JSON);
}
