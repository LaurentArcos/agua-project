/**
 * AGUA — Webhook d'écriture Google Apps Script
 * =============================================
 * Ce script permet à l'app Next.js d'AJOUTER une ligne dans le Google Sheet
 * sans compte de service (la lecture, elle, passe par l'endpoint public gviz).
 *
 * ── Déploiement ──
 * 1. Ouvre ton Google Sheet -> menu Extensions -> Apps Script.
 * 2. Colle ce code dans le fichier Code.gs (remplace tout).
 * 3. Ajuste TAB_NAME si l'onglet ne s'appelle pas "Histo_Saisies".
 * 4. (Recommandé) Définis un TOKEN secret et reporte-le dans .env
 *    (GOOGLE_APPS_SCRIPT_TOKEN).
 * 5. Clique sur "Déployer" -> "Nouveau déploiement" -> type "Application Web".
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : "Tout le monde"
 * 6. Copie l'URL /exec générée dans .env (GOOGLE_APPS_SCRIPT_URL).
 */

const VERSION = "v4-headers";    // pour vérifier quelle version est EN LIGNE (voir doGet)
const SHEET_GID = 757105628;     // gid de l'onglet (dans l'URL #gid=...) — fiable
const TAB_NAME = "Histo_Saisies"; // repli si le gid ne correspond pas
const TOKEN = ""; // mets la même valeur que GOOGLE_APPS_SCRIPT_TOKEN (ou laisse vide)

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    if (TOKEN && body.token !== TOKEN) {
      return json({ ok: false, error: "Token invalide" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // 1) on cible l'onglet par son GID (insensible au nom), 2) repli sur le nom.
    let sheet = ss.getSheets().filter(function (s) {
      return s.getSheetId() === SHEET_GID;
    })[0];
    if (!sheet) sheet = ss.getSheetByName(TAB_NAME);
    if (!sheet) {
      return json({
        ok: false,
        error:
          "Onglet introuvable (gid " +
          SHEET_GID +
          "). Onglets dispo : " +
          ss.getSheets().map(function (s) { return s.getName(); }).join(", "),
      });
    }

    // Valeur à écrire pour chaque nom de colonne (insensible à l'ordre / aux colonnes en plus).
    const valueByHeader = {
      "Date": "'" + body.date,        // apostrophe = force le format texte (JJ-MM-AAAA)
      "Index_m3": Number(body.indexM3),
      "Conso_L": Number(body.consoL),
      "Cout_EUR": Number(body.coutEur),
      "Mode_Vacances": body.vacances ? "TRUE" : "FALSE",
      "Arrosage": body.arrosage ? "TRUE" : "FALSE",
      "Piscine": body.piscine ? "TRUE" : "FALSE",
    };

    // On lit la ligne d'en-tête et on place chaque valeur sous la bonne colonne.
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const newRow = headers.map(function (h) {
      const key = String(h).trim();
      return valueByHeader.hasOwnProperty(key) ? valueByHeader[key] : "";
    });

    sheet.appendRow(newRow);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Test rapide depuis le navigateur : vérifie le champ "version".
function doGet() {
  return json({ ok: true, status: "alive", version: VERSION });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
