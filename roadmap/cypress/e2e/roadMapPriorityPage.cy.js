import redis from "../../lib/redis";

describe("Road map priorities", () => {
  const HOME_PAGE = "http://localhost:3000/";
  beforeEach(async () => {
    await cy.request("http://localhost:3000/api/flush-all");
  });

  describe("given a user inputs a new task and clicks the request button", () => {
    it("should clear the request input", () => {
      cy.visit(HOME_PAGE);
      cy.get("#request_input").type("Hello World.");
      cy.get("#request_button").click();

      cy.get("#request_input").should("contain", "");
    });

    it("should add request to list when submit is clicked", () => {
      cy.visit(HOME_PAGE);
      cy.get("#request_input").type("Hello World.");
      cy.get("#request_button").click();

      cy.get(".w-full").find(".record-item").should("have.length", 1);
    });

    it("should automatically have your vote.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#request_input").type(
        "request should automatically have your vote."
      );
      cy.get("#request_button").click();

      cy.get(".w-full")
        .find(".record-item .bg-green-100")
        .should("have.length", 1);
    });

    it("should set the vote count to 1.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#request_input").type(
        "request should automatically have your vote."
      );
      cy.get("#request_button").click();

      cy.get("#feature_score").then((el) => {
        expect(el).to.have.text(1);
      });
    });

    it("should show validation message when request input is empty.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#request_button").click();

      cy.get("#request_input").then((elm) => {
        expect(elm[0].validationMessage).to.eq("Please fill out this field.");
      });
    });

    it("error toast should be displayed when request exceeds 150 characters.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#request_input").type(getTextWithLengthGreaterThan150());
      cy.get("#request_button").click();

      cy.get(".go1415219401").then((elm) => {
        expect(elm[0].innerHTML).to.eq("Max 150 characters please.");
      });
    });

    it("email textbox should be cleared on email submit.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#email").type("mail@mail.com");
      cy.get("#email_submit").click();

      cy.get("#email").should("contain", "");
    });
    it("should display success message when email is submitted.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#email").type("mail@mail.com");
      cy.get("#email_submit").click();

      cy.get(".go1415219401").then((elm) => {
        expect(elm[0].innerHTML).to.eq(
          "You are now subscribed to feature updates!"
        );
      });
      cy.get(".go1415219401")
        .invoke("attr", "aria-live")
        .should("eq", "polite");
    });

    it("should show validation message when email input is empty.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#email_submit").click();

      cy.get("#email").then((elm) => {
        expect(elm[0].validationMessage).to.eq("Please fill out this field.");
      });
    });

    it("should show validation message when email does not have @ sign.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#email").type("hello");
      cy.get("#email_submit").click();

      cy.get("#email").then((elm) => {
        expect(elm[0].validationMessage).to.eq(
          "Please include an '@' in the email address. 'hello' is missing an '@'."
        );
      });
    });

    it("should show validation message when email does not have domain.", () => {
      cy.visit(HOME_PAGE);
      cy.get("#email").type("hello@");
      cy.get("#email_submit").click();

      cy.get("#email").then((elm) => {
        expect(elm[0].validationMessage).to.eq(
          "Please enter a part following '@'. 'hello@' is incomplete."
        );
      });
    });

    it("vote count should increase by one if vote already exists", async () => {
      await cy.request({
        method: "POST",
        url: "http://localhost:3000/api/create",
        headers: {
          "x-forwarded-for": "192.168.0.50",
        },
        body: {
          title: "a cool request 3",
        },
      });
      cy.visit(HOME_PAGE);
      cy.get("#vote_button").click();
      cy.get("#feature_score").should("contain", 2);
      cy.get("#vote_button").then((elm) => {
        expect(elm[0].className).to.include(
          "bg-green-100"
        );
      });
    });


    it.only("features should have been re-ordered", () => {
      addRequest('Ireland to win by 5')
        .then(() => addRequest('Springboks to draw with Ireland'))
        .then(() => addRequest('Springboks to win by 5'))
        .then(() => visitHomePage())
        .then(() => {
          assertFeatureTextShouldContain("Ireland to win by 5", 0);
          assertFeatureTextShouldContain("Springboks to draw with Ireland", 1);
          assertFeatureTextShouldContain("Springboks to win by 5", 2);
        })
        .then(() => {
          getAllFeatures().then((features) => {
            const springboksToWin = getFeatureByTitleFrom(features, "Springboks to win by 5");
            upvoteFeature(springboksToWin.id, springboksToWin.title, "192.168.0.100")
              .then(() => visitHomePage())
              .then(() => {
                assertFeatureTextShouldContain("Springboks to win by 5", 0);
              })
              .then(() => {
                const draw = getFeatureByTitleFrom(features, "Springboks to draw with Ireland");
                upvoteFeature(draw.id, draw.title, "192.168.0.101")
                  .then(() => upvoteFeature(draw.id, draw.title, "192.168.0.102"))
                  .then(() => visitHomePage())
                  .then(() => {
                    assertFeatureTextShouldContain("Springboks to draw with Ireland", 0);
                    assertFeatureTextShouldContain("Springboks to win by 5", 1);
                    assertFeatureTextShouldContain("Ireland to win by 5", 2);
                  })
              })
          });
        });

    });

    const getFeatureByTitleFrom = (features, title) => {
      return features.find((f) => f.title === title)
    }

    const assertFeatureTextShouldContain = (text, position) => {
      cy.get(".record-item").eq(position)
        .should("contain.text", text);
    }

    const visitHomePage = () => {
      return cy.visit(HOME_PAGE);
    }

    const getAllFeatures = () => {
      return cy.request({
        method: "GET",
        url: "http://localhost:3000/api/features",
      }).then((result) => {
        return result.body.features;
      });
    }

    const upvoteFeature = async (id, title, ip) => {
      return cy.request({
        method: "POST",
        url: "http://localhost:3000/api/vote",
        headers: {
          "x-forwarded-for": ip,
        },
        body: {
          id,
          title,
        },
      });
    }

    const addRequest = (title) => {
      return cy.request({
        method: "POST",
        url: "http://localhost:3000/api/create",
        headers: {
          "x-forwarded-for": "192.168.0.50",
        },
        body: {
          title,
        },
      });
    }

    function getTextWithLengthGreaterThan150() {
      return "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis p";
    }

  });
});