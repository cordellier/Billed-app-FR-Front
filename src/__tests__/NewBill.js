/**
 * @jest-environment jsdom
 */

import NewBill from "../containers/NewBill.js";

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Lorsque je suis sur la page de Nouvelle note de frais", () => {
    describe("lorsque je télécharge un fichier avec le format correct", () => {
      test("devrait enregistrer l'e-mail de l'utilisateur", () => {
        // Fonctions et données fictives
        const mockGetElementById = jest.fn().mockReturnValue({});
        const createMock = jest
          .fn()
          .mockResolvedValue({ fileUrl: "fileURL", key: "key" });
        const goodFormatFile = new File(["img"], "image.png", {
          type: "image/png",
        });

        const documentMock = {
          querySelector: (selector) => {
            if (selector === 'input[data-testid="file"]') {
              return {
                files: [goodFormatFile],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
          getElementById: mockGetElementById,
        };

        // Configuration de localStorage
        localStorage.setItem("user", '{"email" : "user@email.com"}');

        // Configuration de l'instance de test
        const storeMock = {
          bills: () => ({
            create: createMock,
          }),
        };
        const objInstance = new NewBill({
          document: documentMock,
          onNavigate: {},
          store: storeMock,
          localStorage: {},
        });

        // Déclenchement du téléchargement de fichier
        objInstance.handleChangeFile({
          preventDefault: jest.fn(),
          target: { value: "image.png" },
        });

        // Assertions
        const expectedEmail = "user@email.com";
        const formData = createMock.mock.calls[0][0].data;
        console.log("formData", formData);

        expect(formData.get("email")).toEqual(expectedEmail);
      });
    });

    describe("lorsque je soumets une nouvelle note de frais", () => {
      test("devrait appeler la méthode update sur le store", () => {
        // Fonctions et données fictives
        const mockGetElementById = jest.fn().mockReturnValue({});
        const createMock = jest.fn();
        const goodFormatFile = new File(["img"], "image.png", {
          type: "image/png",
        });
        const mockUpdate = jest.fn().mockResolvedValue({});
        const documentMock = {
          querySelector: (selector) => {
            if (selector === 'input[data-testid="file"]') {
              return {
                files: [goodFormatFile],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
          getElementById: mockGetElementById,
        };
        const storeMock = {
          bills: () => ({
            update: mockUpdate,
          }),
        };

        // Configuration de l'instance de test
        const objInstance = new NewBill({
          document: documentMock,
          onNavigate: jest.fn(),
          store: storeMock,
          localStorage: {},
        });

        // Déclenchement de la soumission du formulaire
        objInstance.handleSubmit({
          preventDefault: jest.fn(),
          target: {
            querySelector: (selector) => {
              switch (selector) {
                case 'select[data-testid="expense-type"]':
                  return { value: "type" };
                case 'input[data-testid="expense-name"]':
                  return { value: "name" };
                case 'input[data-testid="amount"]':
                  return { value: "3000" };
                case 'input[data-testid="datepicker"]':
                  return { value: "date" };
                case 'input[data-testid="vat"]':
                  return { value: "vat" };
                case 'input[data-testid="pct"]':
                  return { value: "25" };
                case 'textarea[data-testid="commentary"]':
                  return { value: "commentary" };
              }
            },
          },
        });

        // Assertions
        const dataToCheck = {
          email: "user@email.com",
          type: "type",
          name: "name",
          amount: 3000,
          date: "date",
          vat: "vat",
          pct: 25,
          commentary: "commentary",
          fileUrl: null,
          fileName: null,
          status: "pending",
        };

        // Analyse des données transmises à la fonction
        const data = JSON.parse(mockUpdate.mock.calls[0][0].data);
        console.log("data?", data);

        expect(data).toMatchObject(dataToCheck);
      });
    });
  });
});
