/**
 * @jest-environment jsdom
 */
import { screen, waitFor, within } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockedStore);

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Lorsque je suis sur la page des notes de frais", () => {
    test("Alors l'icône de facture dans la disposition verticale devrait être mise en évidence", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      const windowIcon = screen.getByTestId("icon-window");
      await waitFor(() => windowIcon);
      expect(windowIcon).toHaveClass("active-icon"); //TODO 5
    });

    test("Alors les notes de frais devraient être triées de la plus ancienne à la plus récente", () => {
      document.body.innerHTML = BillsUI({
        data: bills,
      });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // -------------------------------------------------------- //

    describe("Lorsque je clique sur le bouton Nouvelle note de frais", () => {
      test("Alors je devrais être redirigé vers le formulaire de Nouvelle note de frais", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        const bills = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const buttonNewBill = screen.getByRole("button", {
          name: /nouvelle note de frais/i,
        });
        expect(buttonNewBill).toBeTruthy();
        const handleClickNewBill = jest.fn(bills.handleClickNewBill);
        buttonNewBill.addEventListener("click", handleClickNewBill);
        userEvent.click(buttonNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
      });
    });

    describe("Lorsque je clique sur une icône d'œil", () => {
      test("Alors une modal devrait s'ouvrir", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const billsPage = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const iconEyes = screen.getAllByTestId("icon-eye");

        const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);

        const modale = document.getElementById("modaleFile");

        $.fn.modal = jest.fn(() => modale.classList.add("show")); //mock de la modale Bootstrap

        iconEyes.forEach((iconEye) => {
          iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
          userEvent.click(iconEye);

          expect(handleClickIconEye).toHaveBeenCalled();

          expect(modale).toHaveClass("show");
        });
      });
    });

    describe("Lorsque je suis sur la page des notes de frais et qu'elle est en cours de chargement", () => {
      test("Alors, la page de chargement devrait être rendue", () => {
        document.body.innerHTML = BillsUI({ loading: true });
        expect(screen.getByText("Loading...")).toBeVisible();
        document.body.innerHTML = "";
      });
    });

    describe("Lorsque je suis sur la page des notes de frais mais que le back-end envoie un message d'erreur", () => {
      test("Alors, la page d'erreur devrait être rendue", () => {
        document.body.innerHTML = BillsUI({ error: "error message" });
        expect(screen.getByText("Erreur")).toBeVisible();
        document.body.innerHTML = "";
      });
    });

    describe("Lorsque je navigue vers la page des notes de frais", () => {
      test("récupère les notes de frais depuis le mock de l'API GET", async () => {
        jest.spyOn(mockedStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );

        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.Bills);

        await waitFor(() => screen.getByText("Mes notes de frais"));

        const newBillBtn = await screen.findByRole("button", {
          name: /nouvelle note de frais/i,
        });
        const billsTableRows = screen.getByTestId("tbody");

        expect(newBillBtn).toBeTruthy();
        expect(billsTableRows).toBeTruthy();
        expect(within(billsTableRows).getAllByRole("row")).toHaveLength(4);
      });

      test("récupère les notes de frais depuis une API et échoue avec un message d'erreur 404", async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("récupère les messages depuis une API et échoue avec un message d'erreur 500", async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
