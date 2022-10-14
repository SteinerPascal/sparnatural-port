import * as DataFactory from "@rdfjs/data-model" ;
import { BgpPattern, Pattern } from "sparqljs";
import { getSettings } from "../../../configs/client-configs/settings";
import { SelectedVal } from "../../generators/ISparJson";
import AddUserInputBtn from "../buttons/AddUserInputBtn";
import WidgetWrapper from "../builder-section/groupwrapper/criteriagroup/edit-components/WidgetWrapper";
import { AbstractWidget, ValueRepetition, WidgetValue } from "./AbstractWidget";
import { Config } from "../../../configs/fixed-configs/SparnaturalConfig";
import SparqlFactory from "../../generators/SparqlFactory";

export interface SearchWidgetValue extends WidgetValue {
  value: {
    key: string;
    label: string;
    search: string;
  };
}

export class SearchWidget extends AbstractWidget {

  protected widgetValues: SearchWidgetValue[];
  addValueBtn: AddUserInputBtn;
  searchInput: JQuery<HTMLElement>;

  constructor(
    parentComponent: WidgetWrapper,
    startClassVal: SelectedVal,
    objectPropVal: SelectedVal,
    endClassVal: SelectedVal
  ) {
    super(
      "search-widget",
      parentComponent,
      null,
      startClassVal,
      objectPropVal,
      endClassVal,
      ValueRepetition.SINGLE
    );
  }

  render() {
    super.render();
    this.searchInput = $(`<input />`);
    this.html.append(this.searchInput);
    this.addValueBtn = new AddUserInputBtn(
      this,
      getSettings().langSearch.ButtonAdd,
      this.#addValueBtnClicked
    ).render();
    return this;
  }
  #addValueBtnClicked = () => {
    this.searchInput.trigger("change");
    let searchWidgetValue: SearchWidgetValue = {
      value: {
        key: this.searchInput.val().toString(),
        label: this.searchInput.val().toString(),
        search: this.searchInput.val().toString(),
      },
    };
    this.renderWidgetVal(this.parseInput(searchWidgetValue));
  };

  parseInput(input:SearchWidgetValue): SearchWidgetValue {
    if (this.searchInput.val().toString() == "") {
      throw Error('Empty String in Search Widget')
    }
    return input;
  }
  
  getRdfJsPattern(): Pattern[] {
    console.log((this.ParentComponent as WidgetWrapper).widgetType)
    switch((this.ParentComponent as WidgetWrapper).widgetType) {
      case Config.GRAPHDB_SEARCH_PROPERTY: {

        let ptrn: BgpPattern = {
          type: "bgp",
          triples: [
            {
              subject: DataFactory.variable(
                this.getVariableValue(this.startClassVal)
              ),
              predicate: DataFactory.namedNode(
                "http://www.ontotext.com/connectors/lucene#query"
              ),
              object: DataFactory.literal(
                `text:${this.widgetValues[0].value.search}`
              ),
            },
            {
              subject: DataFactory.variable(
                this.getVariableValue(this.startClassVal)
              ),
              predicate: DataFactory.namedNode(
                "http://www.ontotext.com/connectors/lucene#entities"
              ),
              object: DataFactory.variable(this.getVariableValue(this.endClassVal)),
            },
          ],
        };
        return [ptrn];
      }
      case Config.STRING_EQUALS_PROPERTY: {
        break;
      }
      case Config.SEARCH_PROPERTY: {
        return [SparqlFactory.buildFilterRegex(
          DataFactory.literal(
            `text:${this.widgetValues[0].value.search}`
          ),
          DataFactory.variable(this.getVariableValue(this.endClassVal))
        )];
      }
    }


  }
}
