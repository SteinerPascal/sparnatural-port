import { Pattern } from "sparqljs";
import tippy from "tippy.js";
import { getSettings } from "../../../../../../../../configs/client-configs/settings";
import AddUserInputBtn from "../../../../../../buttons/AddUserInputBtn";
import InfoBtn from "../../../../../../buttons/InfoBtn";
import WidgetWrapper from "../../WidgetWrapper";
import { AbstractWidget, ValueType, WidgetValue } from "../AbstractWidget";
import "@chenfengyuan/datepicker";
import * as DataFactory from "@rdfjs/data-model" ;
import { SelectedVal } from "../../../../../../../sparql/ISparJson";
import ISpecProvider from "../../../../../../../spec-providers/ISpecProviders";
import SparqlFactory from "../../../../../../../sparql/SparqlFactory";
import { buildDateRangeOrExactDatePattern } from "./TimeDatePattern";

export interface DateTimePickerValue extends WidgetValue {
  value: {
    key: string;
    label: string;
    start: Date;
    stop: Date;
  };
}

// converts props of type Date to type string
type StringifyDate<T> = T extends Date
  ? string
  : T extends object
  ? {
      [k in keyof T]: StringifyDate<T[k]>;
    }
  : T;

// stringified type of DateTimePickerValue
// see: https://effectivetypescript.com/2020/04/09/jsonify/
type StringDateTimeValue = StringifyDate<DateTimePickerValue>

export class TimeDatePickerWidget extends AbstractWidget {
 
  protected widgetValues: DateTimePickerValue[];
  datesHandler: any;
  ParentComponent: any;
  dateFormat: any;
  inputStart: JQuery<HTMLElement>;
  inputEnd: JQuery<HTMLElement>;
  inputValue: JQuery<HTMLElement>;
  infoBtn: InfoBtn;
  addValueBtn: AddUserInputBtn;
  value: DateTimePickerValue;
  startClassVal: SelectedVal;
  objectPropVal: SelectedVal;
  endClassVal: SelectedVal;
  specProvider: ISpecProvider;

  constructor(
    parentComponent: WidgetWrapper,
    datesHandler: any,
    dateFormat: any,
    startClassCal: SelectedVal,
    objectPropVal: SelectedVal,
    endClassVal: SelectedVal,
    specProvider: ISpecProvider
  ) {
    super(
      "timedatepicker-widget",
      parentComponent,
      null,
      startClassCal,
      objectPropVal,
      endClassVal
    );
    this.datesHandler = datesHandler;
    this.dateFormat = dateFormat;
    this.specProvider = specProvider;
  }

  render() {
    super.render();
    this.html.append(
      $(`<span>${getSettings().langSearch.LabelDateFrom}&nbsp;</span>`)
    );
    this.inputStart = $(
      `<input id="input-start" placeholder="${
        getSettings().langSearch.TimeWidgetDateFrom
      }" autocomplete="off" class="${this.dateFormat}" />`
    );
    this.inputEnd = $(
      `<input id="input-end" placeholder="${
        getSettings().langSearch.TimeWidgetDateTo
      }" autocomplete="off" class="${this.dateFormat}" />`
    );
    this.inputValue = $(`<input id="input-value" type="hidden"/>`);
    let span = $(`<span>&nbsp;${getSettings().langSearch.LabelDateTo}&nbsp;</span>`);
    this.html
      .append(this.inputStart)
      .append(span)
      .append(this.inputEnd)
      .append(this.inputValue);
    // Build datatippy info
    let datatippy =
      this.dateFormat == "day"
        ? getSettings().langSearch.TimeWidgetDateHelp
        : getSettings().langSearch.TimeWidgetYearHelp;
    // set a tooltip on the info circle
    var tippySettings = Object.assign({}, getSettings().tooltipConfig);
    tippySettings.placement = "left";
    tippySettings.trigger = "click";
    tippySettings.offset = [this.dateFormat == "day" ? 75 : 50, -20];
    tippySettings.delay = [0, 0];
    this.infoBtn = new InfoBtn(this, datatippy, tippySettings).render();
    //finish datatippy

    this.addValueBtn = new AddUserInputBtn(
      this,
      getSettings().langSearch.ButtonAdd,
      this.#addValueBtnClicked
    ).render();

    let calendarFormat = 
    (this.dateFormat == "day")
    ? getSettings().langSearch.PlaceholderTimeDateDayFormat
    : getSettings().langSearch.PlaceholderTimeDateFormat;

    var options: {
      language: any;
      autoHide: boolean;
      format: any;
      date: any;
      startView: number;
    } = {
      language: getSettings().langSearch.LangCodeTimeDate,
      autoHide: true,
      format: calendarFormat,
      date: null,
      startView: 2,
    };

    this.inputStart.datepicker(options);
    this.inputEnd.datepicker(options);

    return this;
  }

  #addValueBtnClicked = () => {
    let stringDateTimeVal:StringDateTimeValue ={
      value: {
        key: null,
        label: null,
        start:(this.inputStart.val() != '')?this.inputStart.datepicker("getDate").toISOString():null,
        stop:(this.inputEnd.val() != '')?this.inputEnd.datepicker("getDate").toISOString():null,
      },
      valueType: ValueType.SINGLE
    } 
    let widgetVal: DateTimePickerValue = this.parseInput(
      stringDateTimeVal
    );
    if (!widgetVal) return;
    this.renderWidgetVal(widgetVal);
  };

  parseInput(input: StringDateTimeValue): DateTimePickerValue {
    if(!this.#isValidDate(input.value.start) && !this.#isValidDate(input.value.stop)) throw Error('No valid Date received')
    let startValue = new Date(input.value.start)
    let endValue = new Date(input.value.stop)
    if (startValue && endValue && (startValue > endValue)) throw Error('StartDate is bigger than Enddate!')

    let tmpValue: { start: Date; stop: Date };

    if (this.dateFormat == "day") {
      tmpValue = {
        start: (startValue)?new Date(startValue.setHours(0, 0, 0, 0)):null,
        stop: (endValue)?new Date(endValue.setHours(23, 59, 59, 59)):null,
      };
    } else {
      tmpValue = {
        start: (startValue)?
        (new Date(
          startValue.getFullYear(),
          0,
          1,
          0,
          0,
          1,
          0
        )) // first day
        :null, 
        stop: (endValue)?
        (new Date(
          endValue.getFullYear(),
          11,
          31,
          23,
          59,
          59
        )) // last day
        :null
      };
    }
    let dateTimePickerVal: DateTimePickerValue = {
      valueType: ValueType.SINGLE,
      value: {
        key: tmpValue.start+" - "+tmpValue.stop,
        // TODO : this is not translated
        label: this.#getValueLabel(this.inputStart.val().toString(), this.inputEnd.val().toString()),
        start: tmpValue.start,
        stop: tmpValue.stop,
      },
    };
    return dateTimePickerVal;

  }

  getRdfJsPattern(): Pattern[] {
    let beginDateProp = this.specProvider.getBeginDateProperty(this.objectPropVal.type);
    let endDateProp = this.specProvider.getEndDateProperty(this.objectPropVal.type);

    if(beginDateProp != null && endDateProp != null) {
      let exactDateProp = this.specProvider.getExactDateProperty(this.objectPropVal.type);

      return [
        buildDateRangeOrExactDatePattern(
          this.widgetValues[0].value.start?DataFactory.literal(
            this.widgetValues[0].value.start.toISOString(),
            DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
          ):null,
          this.widgetValues[0].value.stop?DataFactory.literal(
            this.widgetValues[0].value.stop.toISOString(),
            DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
          ):null,
          DataFactory.variable(
            this.getVariableValue(this.startClassVal)
          ),
          DataFactory.namedNode(beginDateProp),
          DataFactory.namedNode(endDateProp),
          exactDateProp != null?DataFactory.namedNode(exactDateProp):null,
          DataFactory.variable(this.getVariableValue(this.startClassVal))
        ),
      ];
    } else {
      return [
        SparqlFactory.buildFilterTime(
          this.widgetValues[0].value.start?DataFactory.literal(
            this.widgetValues[0].value.start.toISOString(),
            DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
          ):null,
          this.widgetValues[0].value.stop?DataFactory.literal(
            this.widgetValues[0].value.stop.toISOString(),
            DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
          ):null,
          DataFactory.variable(
            this.getVariableValue(this.startClassVal)
          )
        ),
      ];
    }    
  }

  #getValueLabel = function (startLabel: string, stopLabel: string) {
    let valueLabel = "";
    if ((startLabel != "") && (stopLabel != "")) {
      valueLabel = getSettings().langSearch.LabelDateFrom+' '+ startLabel +' '+getSettings().langSearch.LabelDateTo+' '+ stopLabel ;
    } else if (startLabel != "") {
      valueLabel = getSettings().langSearch.DisplayValueDateFrom+' '+ startLabel ;
    } else if (stopLabel != "") {
      valueLabel = getSettings().langSearch.DisplayValueDateTo+' '+ stopLabel ;
    }

    return valueLabel;
  };

  #isValidDate(dateString:string){
    return (new Date(dateString).toString() !== "Invalid Date") && !isNaN(Date.parse(dateString));
  }
}
