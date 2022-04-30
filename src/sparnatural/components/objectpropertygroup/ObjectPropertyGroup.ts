import tippy from "tippy.js";
import { eventProxiCriteria } from "../../globals/globalfunctions";
import ObjectPropertyTypeId from "./ObjectPropertyTypeId";
import ISettings from "../../../configs/client-configs/ISettings";
import ISpecProvider from "../../spec-providers/ISpecProviders";
import HTMLComponent from "../HtmlComponent";
import CriteriaGroup from "../criteriaList/CriteriaGroup";

/**
 * The property selection part of a criteria/line, encapsulating an ObjectPropertyTypeId
 **/
class ObjectPropertyGroup extends HTMLComponent {
  settings: ISettings;
  objectPropertySelector: ObjectPropertyTypeId;
  value_selected: any = null; // value which shows which object property got chosen by the config for subject and object
  ParentCriteriaGroup: CriteriaGroup;
  specProvider: ISpecProvider;
  constructor(
    ParentComponent: CriteriaGroup,
    specProvider: ISpecProvider,
    settings: ISettings,
    temporaryLabel: string
  ) {
    super("ObjectPropertyGroup", ParentComponent, null);
    this.ParentCriteriaGroup = ParentComponent;
    this.settings = settings;
    this.objectPropertySelector = new ObjectPropertyTypeId(
      this,
      specProvider,
      temporaryLabel
    );
    this.specProvider = specProvider
  }

  render(){
    super.render()
    return this
  }
  /*
		renders the temporarly object property
	*/
  onStartClassGroupSelected() {
    //this will set the temporary label since there hasn't been a Value chosen for EndClassGroup
    this.objectPropertySelector.render();
  }

  /*
		This method is triggered when an Object is selected.
		For example: Museum isRelatedTo Country. As soon as Country is chosen this method gets called
	*/
  onEndClassGroupSelected() {
    console.log('objectpropertygroup.onendclassgroupselected')
    // this will update the temporarly label
    this.objectPropertySelector.render();

    $(this.html).find("select.input-val").niceSelect();
    $(this.html).find(".input-val").removeAttr("disabled").niceSelect("update");
    // opens the select automatically
    if (this.objectPropertySelector.needTriggerClick == false) {
      $(this.html).find(".nice-select:not(.disabled)").trigger("click");
    }
    $(this.html).find("select.input-val").unbind("change");
    // hook the change event to the onChange function
    $(this.html)
      .find("select.input-val")
      .on("change", { arg1: this, arg2: "onChange" }, eventProxiCriteria);

    if (this.objectPropertySelector.needTriggerClick == true) {
      // $(this.html).find('.nice-select:not(.disabled)').trigger('click') ;
      $(this.html).find("select.input-val:not(.disabled)").trigger("change");
      this.objectPropertySelector.needTriggerClick = false;
      //$(this.ParentCriteriaGroup.thisForm_.sparnatural).trigger( {type:"submit" } ) ;
    } else {
      // automatically selects the value if there is only one
      if ($(this.html).find("select.input-val").find("option").length == 1) {
        $(this.html).find(".nice-select:not(.disabled)").trigger("click");
      }
    }

    $(this.ParentCriteriaGroup).trigger("ObjectPropertyGroupSelected");
  }

  onChange() {
    console.log('objectpropertygroup on change called')
    if (this.value_selected) {
      console.warn("ObjectPropertyGroup call OptionsGroup.reload!!!")
      this.ParentCriteriaGroup.OptionsGroup.render();
    }
    this.value_selected = $(this.html).find("select.input-val").val();
    // disable if only one possible property option between the 2 classes
    if ($(this.html).find(".input-val").find("option").length == 1) {
      $(this.html)
        .find(".input-val")
        .attr("disabled", "disabled")
        .niceSelect("update");
    }
    $(this.ParentCriteriaGroup).trigger("ObjectPropertyGroupSelected");
    if (
      $(this.ParentCriteriaGroup.html)
        .parent("li")
        .first()
        .hasClass("completed")
    ) {
      $(this.ParentCriteriaGroup.thisForm_.sparnatural).trigger("submit");
    }

    // sets tooltip ready
    var desc = this.specProvider.getTooltip(this.value_selected);
    if (desc) {
      $(this.ParentCriteriaGroup.ObjectPropertyGroup.html)
        .find(".ObjectPropertyTypeId")
        .attr("data-tippy-content", desc);
      // tippy('.ObjectPropertyGroup .ObjectPropertyTypeId[data-tippy-content]', settings.tooltipConfig);
      var tippySettings = Object.assign({}, this.settings?.tooltipConfig);
      tippySettings.placement = "top-start";
      tippy(
        ".ObjectPropertyGroup .ObjectPropertyTypeId[data-tippy-content]",
        tippySettings
      );
    } else {
      $(this.ParentCriteriaGroup.ObjectPropertyGroup.html).removeAttr(
        "data-tippy-content"
      );
    }
    //ici peut être lancer le reload du where si il y a des fils
  }
}
export default ObjectPropertyGroup;