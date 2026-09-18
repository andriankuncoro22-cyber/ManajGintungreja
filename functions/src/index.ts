/**
 * =================================================================================
 * BACKEND GOOGLE APPS SCRIPT - DESA DIGITAL (VERSI 7.5 - STABLE CALENDAR)
 * =================================================================================
 * 
 * PETUNJUK DEPLOY (WAJIB):
 * 1. Klik ikon '+' di sebelah "Services" -> Tambahkan: Google Calendar API & Google Drive API.
 * 2. Ganti seluruh isi kode dengan kode ini.
 * 3. Klik "Run" pada fungsi 'forceGrantAllPermissions' untuk Otorisasi.
 * 4. Klik "Deploy" -> "New Deployment" -> "Web App".
 * 5. Execute as: Me | Who has access: Anyone (SIAPA SAJA).
 * 
 * =================================================================================
 */

const GEMINI_API_KEY = "AIzaSyC14sMFsIWhjaZHEv8BzMyAQJtYqUxp6Xo"; 

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Tidak ada data yang diterima.");
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;

    switch (action) {
      case 'saveToDrive':
        result = handleSaveToDrive(data);
        break;

      case 'askAI':
        result = handleAskAI(data);
        break;
      
      case 'createEventAndUpload':
        result = handleCreateEventAndUpload(data);
        break;
      
      case 'uploadArchiveFile':
        result = handleArchiveUpload(data);
        break;
        
      case 'getCalendar':
        result = handleGetCalendar(data);
        break;

      case 'updateEventDescription':
        result = handleUpdateDescription(data);
        break;

      case 'generateNumber':
        result = handleGenerateNumber(data);
        break;

      default:
        throw new Error("Aksi tidak dikenal: " + action);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, ...result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('doPost Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Script Error: " + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Menyimpan laporan kegiatan ke Drive dengan proteksi Folder ID.
 */
function handleSaveToDrive(data) {
  const { folderName, parentFolderId, files } = data;
  let parentFolder;
  
  try {
    parentFolder = DriveApp.getFolderById(parentFolderId);
  } catch (e) {
    parentFolder = DriveApp.getRootFolder();
  }

  const newFolder = parentFolder.createFolder(folderName);
  const fileUrls = { photos: [], materials: [] };

  const saveFile = (fileInfo, folder) => {
    if (!fileInfo || !fileInfo.base64) return null;
    const decoded = Utilities.base64Decode(fileInfo.base64);
    const blob = Utilities.newBlob(decoded, fileInfo.type, fileInfo.name);
    const file = folder.createFile(blob);
    return file.getUrl();
  };

  if (files.photos) {
    files.photos.forEach(photo => {
      const url = saveFile(photo, newFolder);
      if (url) fileUrls.photos.push(url);
    });
  }
  
  if (files.materials) {
    files.materials.forEach(material => {
      const url = saveFile(material, newFolder);
      if (url) fileUrls.materials.push(url);
    });
  }
  
  fileUrls.undangan = saveFile(files.undangan, newFolder);
  fileUrls.notulen = saveFile(files.notulen, newFolder);
  fileUrls.bast = saveFile(files.bast, newFolder);

  return {
    folderId: newFolder.getId(),
    fileUrls: fileUrls
  };
}

/**
 * Membuat event kalender dan upload file dengan fallback folder.
 */
function handleCreateEventAndUpload(data) {
  const { eventData, fileData, folderId } = data;
  let fileUrl = null;
  
  if (fileData && fileData.base64) {
    try {
      let targetFolder;
      try {
        targetFolder = DriveApp.getFolderById(folderId);
      } catch (e) {
        targetFolder = DriveApp.getRootFolder();
      }
      
      const decoded = Utilities.base64Decode(fileData.base64);
      const blob = Utilities.newBlob(decoded, fileData.type, fileData.name);
      fileUrl = targetFolder.createFile(blob).getUrl();
    } catch (e) {
      throw new Error("Gagal akses Drive: " + e.message);
    }
  }

  const startTime = new Date(eventData.start);
  const endTime = new Date(eventData.end);
  const fullDesc = (eventData.description || '') + (fileUrl ? `\n\n🔗 Link Undangan: ${fileUrl}` : '');

  // 1. Coba gunakan CalendarApp bawaan (Tidak butuh aktivasi Advanced Google Service)
  try {
    let cal = null;
    const targetCalId = eventData.calendarId;
    if (targetCalId && targetCalId !== "primary" && targetCalId.includes("@")) {
      try {
        cal = CalendarApp.getCalendarById(targetCalId);
      } catch (err) {}
    }
    if (!cal) {
      cal = CalendarApp.getDefaultCalendar();
    }

    if (cal) {
      const createdEvent = cal.createEvent(eventData.title, startTime, endTime, {
        description: fullDesc,
        location: eventData.location || ''
      });
      return { 
        eventUrl: "https://calendar.google.com/calendar/r", 
        eventId: createdEvent.getId(),
        fileUrl: fileUrl 
      };
    }
  } catch (calAppErr) {
    console.warn("CalendarApp warning, mencoba Advanced Calendar:", calAppErr);
  }

  // 2. Fallback ke Advanced Service Calendar jika aktif
  if (typeof Calendar !== 'undefined' && Calendar.Events) {
    const eventResource = {
      summary: eventData.title,
      location: eventData.location,
      description: fullDesc,
      start: { dateTime: eventData.start, timeZone: 'Asia/Jakarta' },
      end: { dateTime: eventData.end, timeZone: 'Asia/Jakarta' }
    };
    try {
      const createdEvent = Calendar.Events.insert(eventResource, eventData.calendarId || "primary");
      return { eventUrl: createdEvent.htmlLink, fileUrl: fileUrl };
    } catch (e) {
      throw new Error("Gagal akses Kalender: " + e.message);
    }
  }

  throw new Error("Gagal akses Kalender: Kalender tidak dapat diakses atau izin belum diberikan.");
}

function handleGenerateNumber(data) {
  const randomNum = Math.floor(100 + Math.random() * 900);
  const year = new Date().getFullYear();
  const docNumber = `090/${randomNum}/SPPD/${year}`;
  return { docNumber: docNumber };
}

function handleAskAI(data) {
  const { prompt } = data;
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { 'method': 'post', 'contentType': 'application/json', 'payload': JSON.stringify(payload) };
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  return { text: result.candidates[0].content.parts[0].text };
}

function handleGetCalendar(data) {
  try {
    const { calendarId, date } = data;
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) throw new Error("Format tanggal tidak valid.");
    
    const startTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1, 0, 0, 0);
    
    // 1. Gunakan CalendarApp bawaan (Aman dan tidak butuh Advanced Service)
    let cal = null;
    if (calendarId && calendarId !== "primary" && calendarId.includes("@")) {
      try {
        cal = CalendarApp.getCalendarById(calendarId);
      } catch (e) {}
    }
    if (!cal) {
      cal = CalendarApp.getDefaultCalendar();
    }
    
    if (cal) {
      const events = cal.getEvents(startTime, endTime);
      const items = events.map(function(ev) {
        return {
          id: ev.getId(),
          summary: ev.getTitle(),
          description: ev.getDescription() || "",
          location: ev.getLocation() || "",
          start: { dateTime: ev.getStartTime().toISOString() },
          end: { dateTime: ev.getEndTime().toISOString() }
        };
      });
      return { items: items };
    }

    // 2. Fallback jika Advanced Service Calendar aktif
    if (typeof Calendar !== 'undefined' && Calendar.Events) {
      const calId = (calendarId && calendarId.includes("@")) ? calendarId : "primary";
      const response = Calendar.Events.list(calId, { 
        timeMin: startTime.toISOString(), 
        timeMax: endTime.toISOString(), 
        singleEvents: true, 
        orderBy: 'startTime' 
      });
      return { items: response.items || [] };
    }
    
    return { items: [] };
  } catch (err) {
    throw new Error("Gagal mengambil agenda: " + err.message);
  }
}

function handleUpdateDescription(data) {
  const { calendarId, eventId, newContent } = data;
  const separator = "\n\n--- NOTULENSI ---";

  // 1. Coba dengan CalendarApp bawaan
  let cal = null;
  if (calendarId && calendarId !== "primary" && calendarId.includes("@")) {
    try {
      cal = CalendarApp.getCalendarById(calendarId);
    } catch (e) {}
  }
  if (!cal) {
    cal = CalendarApp.getDefaultCalendar();
  }

  if (cal) {
    try {
      const ev = cal.getEventById(eventId);
      if (ev) {
        let description = (ev.getDescription() || "").split(separator)[0];
        const finalDescription = description.trim() + separator + "\n" + newContent.trim();
        ev.setDescription(finalDescription);
        return { message: "Notulensi disimpan." };
      }
    } catch (err) {
      console.warn("CalendarApp update error:", err);
    }
  }

  // 2. Fallback ke Advanced Calendar
  if (typeof Calendar !== 'undefined' && Calendar.Events) {
    try {
      const calId = (calendarId && calendarId.includes("@")) ? calendarId : "primary";
      const event = Calendar.Events.get(calId, eventId);
      let description = (event.description || "").split(separator)[0];
      const finalDescription = description.trim() + separator + "\n" + newContent.trim();
      Calendar.Events.patch({ description: finalDescription }, calId, eventId);
      return { message: "Notulensi disimpan." };
    } catch (e) {
      throw new Error("Gagal update event: " + e.message);
    }
  }

  return { message: "Event tidak ditemukan." };
}

function handleArchiveUpload(data) {
  const { fileData, fileName, folderId } = data;
  let targetFolder;
  try {
    targetFolder = DriveApp.getFolderById(folderId);
  } catch (e) {
    targetFolder = DriveApp.getRootFolder();
  }
  
  const decoded = Utilities.base64Decode(fileData.base64);
  const blob = Utilities.newBlob(decoded, fileData.type, fileName);
  const file = targetFolder.createFile(blob);
  return { fileUrl: file.getUrl(), fileId: file.getId() };
}

function forceGrantAllPermissions() {
  const root = DriveApp.getRootFolder();
  Logger.log("Akses Drive OK: " + root.getName());
  const cal = CalendarApp.getDefaultCalendar();
  Logger.log("Akses Kalender OK: " + (cal ? cal.getName() : "None"));
  if (typeof Calendar !== 'undefined' && Calendar.Events) {
    try {
      Calendar.Events.list("primary", {maxResults: 1});
      Logger.log("API Advanced Calendar OK");
    } catch (e) {
      Logger.log("API Advanced Calendar ERROR: " + e.message);
    }
  } else {
    Logger.log("Menggunakan CalendarApp bawaan (Aman, tidak memerlukan Advanced Service).");
  }
}
