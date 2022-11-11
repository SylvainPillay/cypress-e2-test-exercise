import redis from "../../lib/redis";

describe("Road map priorities", () => {
  const HOME_PAGE = "http://localhost:3000/";
  beforeEach(() => {
    cy.request("http://localhost:3000/api/flush-all");
  });

  describe("given a user inputs a new task and clicks the request button", () => {
    it("should clear the request input", () => {
      visitHomePage().then(() => {
        getRequestInput().type("Hello World.");
        getRequestButton().click();

        getRequestInput().should("contain", "");
      })
    });

    it("should add request to list when submit is clicked", () => {
      visitHomePage().then(() => {
        getRequestInput().type("Hello World.");
        getRequestButton().click();

        cy.get(".w-full").find(".record-item").should("have.length", 1);
      });
    });

    it("should automatically have your vote.", () => {
      visitHomePage().then(() => {
        getRequestInput().type(
          "request should automatically have your vote."
        );
        getRequestButton().click();

        cy.get("[data-released=\"false\"]")
          .should("have.length", 1);
      });
    });

    it("should set the vote count to 1.", () => {
      visitHomePage().then(() => {
        getRequestInput().type("request should automatically have your vote.");
        getRequestButton().click();

        getFeatureScore().then((el) => {
          expect(el).to.have.text(1);
        });
      });
    });

    it("should show validation message when request input is empty.", () => {
      visitHomePage().then(() => {
        getRequestButton().click();

        getRequestInput().then((elm) => {
          expect(elm[0].validationMessage).to.eq("Please fill out this field.");
        });
      });
    });

    it("error toast should be displayed when request exceeds 150 characters.", () => {
      visitHomePage().then(() => {
        getRequestInput().type(getTextWithLengthGreaterThan150());
        getRequestButton().click();

        cy.get(".go1415219401").then((elm) => {
          expect(elm[0].innerHTML).to.eq("Max 150 characters please.");
        });
      });
    });

    it("email textbox should be cleared on email submit.", () => {
      visitHomePage().then(() => {
        getEmail().type("mail@mail.com");
        getEmailSubmit().click();

        getEmail().should("contain", "");
      });
    });
    it("should display success message when email is submitted.", () => {
      visitHomePage().then(() => {
        getEmail().type("mail@mail.com");
        getEmailSubmit().click();

        getEmailSuccessMessage().then((elm) => {
          expect(elm[0].innerHTML).to.eq(
            "You are now subscribed to feature updates!"
          );
        });

        getEmailSuccessMessage()
          .invoke("attr", "aria-live")
          .should("eq", "polite");
      });
    });

    it("should show validation message when email input is empty.", () => {
      visitHomePage().then(() => {
        getEmailSubmit().click();

        getEmail().then((elm) => {
          expect(elm[0].validationMessage).to.eq("Please fill out this field.");
        });
      });
    });

    it("should show validation message when email does not have @ sign.", () => {
      visitHomePage().then(() => {
        getEmail().type("hello");
        getEmailSubmit().click();

        getEmail().then((elm) => {
          expect(elm[0].validationMessage).to.eq(
            "Please include an '@' in the email address. 'hello' is missing an '@'."
          );
        });
      });
    });

    it("should show validation message when email does not have domain.", () => {
      visitHomePage().then(() => {
        getEmail().type("hello@");
        getEmailSubmit().click();

        getEmail().then((elm) => {
          expect(elm[0].validationMessage).to.eq(
            "Please enter a part following '@'. 'hello@' is incomplete."
          );
        });
      });
    });

    it("vote count should increase by one if vote already exists", () => {
      addFeature('a cool request 3')
        .then(() => {
          visitHomePage().then(() => {
            getVoteButton().click();
            getFeatureScore().should("contain", 2);
            getVoteButton().then((elm) => {
              expect(elm[0].className).to.include(
                "bg-green-100"
              );
            });
          });
        })
    });


    it("features should have been re-ordered", () => {
      addFeature('Ireland to win by 5')
        .then(() => addFeature('Springboks to draw with Ireland'))
        .then(() => addFeature('Springboks to win by 5'))
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

    it("feature should display tick when released", () => {
      addFeature('add release flag capability').then(() => {
        visitHomePage().then(() => {
          cy.get("[data-released=\"false\"]")
            .should("have.length", 1);
        })
        getAllFeatures().then((features) => {
          releaseFeature(features[0].id).then(() => {
            visitHomePage().then(() => {
              cy.get("[data-released=\"true\"]")
                .should("have.length", 1);
            })
          })
        });
      });

    });

    const getVoteButton = () => {
      return cy.get("#vote_button");
    }

    const getEmail = () => {
      return cy.get("#email");
    }

    const getEmailSubmit = () => {
      return cy.get("#email_submit");
    }

    const getEmailSuccessMessage = () => {
      return cy.get(".go1415219401");
    }

    const getFeatureScore = () => {
      return cy.get("#feature_score");
    }

    const getRequestButton = () => {
      return cy.get("#request_button");
    }

    const getRequestInput = () => {
      return cy.get("#request_input");
    }

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

    const releaseFeature = async (id) => {
      return cy.request({
        method: "POST",
        url: "http://localhost:3000/api/release",
        body: {
          id,
        },
      });
    }

    const addFeature = (title) => {
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