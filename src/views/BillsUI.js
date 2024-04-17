import VerticalLayout from "./VerticalLayout.js";
import ErrorPage from "./ErrorPage.js";
import LoadingPage from "./LoadingPage.js";

import Actions from "./Actions.js";

const row = (bill) => {
  return `
    <tr>
      <td>${bill.type}</td>
      <td>${bill.name}</td>
      <td>${bill.date}</td>
      <td>${bill.amount} €</td>
      <td>${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
    `;
};

const parseCustomDate = (dateString) => {
  const parts = dateString.split(" ");

  const day = parts[0];
  const monthAbbr = parts[1];
  const year = parts[2];

  const monthAbbreviations = {
    "Jan.": 0,
    "Fév.": 1,
    "Mar.": 2,
    "Avr.": 3,
    Mai: 4,
    Juin: 5,
    "Juil.": 6,
    Août: 7,
    "Sept.": 8,
    "Oct.": 9,
    "Nov.": 10,
    "Déc.": 11,
  };

  const month = monthAbbreviations[monthAbbr];

  // Ajouter un ajustement au jour pour les jours à un chiffre
  const adjustedDay = day.length === 1 ? `0${day}` : day;

  // Retourne un objet Date
  return new Date(year, month, adjustedDay);
};

const rows = (data) => {
  const sortedBills = data?.sort((a, b) => {
    const dateA = parseCustomDate(a.date).getTime();
    const dateB = parseCustomDate(b.date).getTime();
    return dateB - dateA;
  });
  return sortedBills?.map((bill) => row(bill)).join("") ?? "";
};

export default ({ data: bills, loading, error }) => {
  const modal = () => `
    <div class="modal fade" id="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `;

  if (loading) {
    return LoadingPage();
  } else if (error) {
    return ErrorPage(error);
  }

  return `
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid='btn-new-bill' class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
        <table id="example" class="table table-striped" style="width:100%">
          <thead>
              <tr>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
          </thead>
          <tbody data-testid="tbody">
            ${rows(bills)}
          </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>`;
};
