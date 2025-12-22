const SS = SpreadsheetApp.getActiveSpreadsheet();

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // 1. تسجيل الدخول
    if (action === "verifyOTP") {
      const rows = SS.getSheetByName("Users").getDataRange().getValues();
      const inputID = data.empID.toString().trim();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].toString().trim() === inputID) {
          const user = { name: rows[i][1], role: rows[i][4].toLowerCase(), status: rows[i][5].toLowerCase() };
          if (user.status !== "active") return response(false, "الحساب معلق");
          return response(true, "تم التحقق", user);
        }
      }
      return response(false, "المستخدم غير مسجل");
    }

    // 2. إضافة سجل وتوليد رقم SAQR تلقائي
    if (action === "addRecord") {
      const sheet = SS.getSheetByName("Records");
      const lastRow = sheet.getLastRow();
      let nextID = 1001;
      if (lastRow > 1) {
        const lastVal = sheet.getRange(lastRow, 1).getValue().toString();
        const lastNum = parseInt(lastVal.split('-')[1]);
        if (!isNaN(lastNum)) nextID = lastNum + 1;
      }
      const orderID = "SAQR-" + nextID;
      sheet.appendRow([orderID, new Date(), data.empID, data.empName, data.category, parseFloat(data.amount)||0, "Pending", data.notes]);
      return response(true, "تم الحفظ", { orderID: orderID });
    }

    // 3. جلب بيانات الحوكمة والمالية
    if (action === "getGovData" || action === "getStats") {
      const records = SS.getSheetByName("Records").getDataRange().getValues();
      let total = 0, list = [];
      for (let i = 1; i < records.length; i++) {
        total += parseFloat(records[i][5]) || 0;
        list.push({id:records[i][0], date:records[i][1], emp:records[i][3], cat:records[i][4], amt:records[i][5], status:records[i][6]});
      }
      return response(true, "نجاح", { total: total.toLocaleString(), recentRecords: list.reverse() });
    }

    // 4. تحديث الحالة (Approved / Rejected)
    if (action === "updateStatus") {
      const sheet = SS.getSheetByName("Records");
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.orderID) {
          sheet.getRange(i + 1, 7).setValue(data.newStatus);
          return response(true, "تم التحديث");
        }
      }
    }

    // 5. إرسال بلاغ دعم فني
    if (action === "sendSupportTicket") {
      const sheet = SS.getSheetByName("Records");
      const ticketID = "TICK-" + Math.floor(Math.random() * 9000 + 1000);
      sheet.appendRow([ticketID, new Date(), data.empID, data.empName, "SUPPORT: " + data.type, 0, "Open", data.description]);
      return response(true, "تم الإرسال", { ticketID: ticketID });
    }

  } catch (e) { return response(false, e.toString()); }
}

function response(s, m, d = {}) {
  return ContentService.createTextOutput(JSON.stringify({success:s, msg:m, data:d})).setMimeType(ContentService.MimeType.JSON);
}
