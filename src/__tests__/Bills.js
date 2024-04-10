/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/dom";
import Bills from "../containers/Bills";
import { ROUTES_PATH } from "../constants/routes";
import router from "../app/Router";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { getMockedStore } from "../__mocks__/store";

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je suis sur la page des factures", () => {
    // Utilisation de getMockedStore() pour obtenir le magasin mocké
    const mockedStore = getMockedStore();

    beforeEach(() => {
      // Réinitialisation de la route avant chaque test
      window.history.pushState({}, null, ROUTES_PATH.Bills);
      document.body.innerHTML = BillsUI({ data: [] }); // Initialisation de l'UI des factures
    });

    test("Alors l'icône de la fenêtre dans la mise en page verticale doit être mise en surbrillance", async () => {
      router(); // Initialisation du routeur
      await waitFor(() => screen.getByTestId("icon-window")); // Attente de l'icône de la fenêtre
      const windowIcon = screen.getByTestId("icon-window");
      const hasActiveIconClass = windowIcon.classList.contains("active-icon");
      expect(hasActiveIconClass).toBe(true);
    });

    test("Alors les factures doivent être triées de la plus ancienne à la plus récente", () => {
      document.body.innerHTML = BillsUI({ data: bills }); // Initialisation de l'UI des factures avec des données
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  test("Initialisation du constructeur", () => {
    const mockedStore = getMockedStore();
    const billsInstance = new Bills({
      document: document,
      onNavigate: jest.fn(),
      store: mockedStore,
    });
    expect(billsInstance.document).toBe(document);
    expect(billsInstance.onNavigate).toBeDefined();
    expect(billsInstance.store).toBe(mockedStore);
  });

  test("Alors en cliquant sur le bouton 'Nouvelle facture', je devrais être redirigé vers la page NewBill", async () => {
    const mockedStore = getMockedStore();
    router(); // Initialisation du routeur
    await window.onNavigate(ROUTES_PATH.Bills); // Naviguer vers la page des factures
    // Attendre que le bouton "Nouvelle facture" apparaisse dans le DOM
    await waitFor(() => screen.getByTestId("btn-new-bill"));
    const buttonNewBill = screen.getByTestId("btn-new-bill");
    // Simuler un clic sur le bouton "Nouvelle facture"
    await buttonNewBill.dispatchEvent(new MouseEvent("click"));
    // Vérifier que l'URL naviguée est correcte
    const newBillUrl = window.location.href.replace(
      /^https?:\/\/localhost\//,
      ""
    );
    expect(newBillUrl).toBe("#employee/bill/new");
  });
});

test("handleClickIconEye est appelé lorsque l'icône est cliquée", () => {
  const mockedStore = getMockedStore();
  const billsInstance = new Bills({
    document: document,
    onNavigate: jest.fn(),
    store: mockedStore,
  });
  const mockIcon = document.createElement("div");
  mockIcon.setAttribute("data-bill-url", "mockBillUrl");

  // Mock de la méthode handleClickIconEye
  billsInstance.handleClickIconEye = jest.fn();

  // Mock de la fonction modal directement sur le prototype de window.$
  window.$.fn.modal = jest.fn();

  // Attacher la méthode handleClickIconEye à l'événement de clic sur l'icône
  mockIcon.addEventListener("click", () =>
    billsInstance.handleClickIconEye(mockIcon)
  );

  // Déclencher l'événement de clic sur l'icône mockée
  mockIcon.dispatchEvent(new MouseEvent("click", { bubbles: true }));

  // Vérifier si la méthode handleClickIconEye a été appelée avec les paramètres attendus
  expect(billsInstance.handleClickIconEye).toHaveBeenCalledWith(mockIcon);
});

test("handleClickIconEye affiche la modale", () => {
  const mockedStore = getMockedStore();
  const billsInstance = new Bills({
    document: document,
    onNavigate: jest.fn(),
    store: mockedStore,
  });
  const mockIcon = document.createElement("div");
  mockIcon.setAttribute("data-bill-url", "mockBillUrl");

  // Mock de la fonction modal directement sur le prototype de window.$
  window.$.fn.modal = jest.fn();

  billsInstance.handleClickIconEye(mockIcon);

  // Vérifier si la fonction modal a été appelée avec les paramètres attendus
  expect(window.$.fn.modal).toHaveBeenCalledWith("show");
});

describe("Méthode getBills", () => {
  test("Retourne une liste vide si le magasin n'est pas initialisé", async () => {
    const billsInstance = new Bills({
      document: document,
      onNavigate: jest.fn(),
      store: null, // Simuler un magasin non initialisé
    });
    const result = await billsInstance.getBills();
    expect(result).toEqual([]); // S'attend à ce que la méthode renvoie une liste vide
  });

  test("Gère le cas où la méthode 'list' du magasin renvoie une erreur", async () => {
    const mockStore = {
      bills() {
        return {
          list() {
            throw new Error("An error occurred");
          },
        };
      },
    };
    const billsInstance = new Bills({
      document: document,
      onNavigate: jest.fn(),
      store: mockStore,
    });
    const result = await billsInstance.getBills();
    expect(result).toEqual([]); // S'attend à ce que la méthode renvoie une liste vide en cas d'erreur
  });

  test("Formate correctement les données des factures", async () => {
    // Mock du magasin avec une liste de factures
    const mockStore = {
      bills() {
        return {
          list() {
            return Promise.resolve([
              {
                id: "123",
                date: "2024-04-01",
                status: "pending",
              },
            ]);
          },
        };
      },
    };
    const billsInstance = new Bills({
      document: document,
      onNavigate: jest.fn(),
      store: mockStore,
    });
    const result = await billsInstance.getBills();
    // S'attend à ce que les données de facture soient correctement formatées
    expect(result).toEqual([
      {
        id: "123",
        date: "01/04/2024", // Format de date attendu
        status: "En attente", // Format de statut attendu
      },
    ]);
  });
});

describe("Méthode handleClickNewBill", () => {
  test("Navigue vers la page NewBill", () => {
    const onNavigateMock = jest.fn();
    const billsInstance = new Bills({
      document: document,
      onNavigate: onNavigateMock,
      store: null,
    });
    billsInstance.handleClickNewBill();
    expect(onNavigateMock).toHaveBeenCalledWith("#employee/bill/new"); // S'attend à ce que la méthode de navigation soit appelée avec le bon chemin
  });
});

describe("Méthode handleClickIconEye", () => {
  test("Affiche la modale avec l'URL de la facture", () => {
    // Mock de l'élément icon avec l'URL de la facture
    const mockIcon = document.createElement("div");
    mockIcon.setAttribute("data-bill-url", "mockBillUrl");
    // Mock de la fonction modal
    window.$.fn.modal = jest.fn();
    const billsInstance = new Bills({
      document: document,
      onNavigate: jest.fn(),
      store: null,
    });
    billsInstance.handleClickIconEye(mockIcon);
    // S'attend à ce que la méthode modal soit appelée avec l'URL de la facture
    expect(window.$.fn.modal).toHaveBeenCalledWith("show");
  });
});
