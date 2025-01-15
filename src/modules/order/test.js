import { Alert } from "react-native";
import { createDraft, finishDraft } from "immer";
import _, { cloneDeep, isObject, isEqual, isEmpty, uniq, groupBy, forEach, omit, isString, isArray } from "lodash";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../../i18n/i18n";
import { apiGetList, apiPatch, apiPost, apiUpdate, getRequestHeader, apiCreate, apiUpdateById, apiGetById } from "../../../helpers/apiHelper";
import { getApiContextFromSelf, listOptionsSelector } from "../../../helpers/componentHelper";
import { apiErrorMessages } from "../../../helpers/errorHelper";
import { loadComponentData } from "../../../helpers/formComponentHelper";
import { equalToDate, equalToId, getDefaultValue, isObjectId, LOADING_STATE } from "../../../helpers/commonHelper";
import { validateData } from "../../../helpers/modelHelper";

import DATA_TYPE from "../../../constants/dataType";
import { TASK_TYPE_LIST } from "../constants/taskTypeConstant";
import { TASK_STATE, TASK_TAB_LIST, TYPE_FIELD_LIST } from "../constants/taskConstant";

const TEMP_FIELD_PREFIX = 'tmp_';

export function getProductListByTaskTab(taskTabName) {
  if (!taskTabName) {
    return 'productList';
  }

  switch (taskTabName) {
    case TASK_TAB_LIST.UNLOADING:
      return 'productList';
    case TASK_TAB_LIST.RECEIVING:
      return 'receivingList';
    case TASK_TAB_LIST.INSPECTION:
      return ['ngProductList', 'okProductList'];
    case TASK_TAB_LIST.PUT_AWAY:
      return 'putAwayList';
    case TASK_TAB_LIST.PICKING:
      return 'pickingList';
    case TASK_TAB_LIST.PACKING:
      return 'packingList';
    case TASK_TAB_LIST.SCAN_SERIAL:
      return 'scannedList';
    default:
      return 'productList';
  }
}

export function getProductListPrefix(taskTabName) {
  switch (taskTabName) {
    case TASK_TAB_LIST.UNLOADING:
      return 'productList';
    case TASK_TAB_LIST.RECEIVING:
      return 'receivingList';
    case TASK_TAB_LIST.INSPECTION:
      return ['ngProductList', 'okProductList'];
    case TASK_TAB_LIST.PUT_AWAY:
      return 'putAwayList';
    case TASK_TAB_LIST.PICKING:
      return 'pickingList';
    case TASK_TAB_LIST.PACKING:
      return 'packingList';
    case TASK_TAB_LIST.SHIPPING:
      return 'shippingList';
    case TASK_TAB_LIST.SCAN_SERIAL:
      return 'scannedList';
    default:
      return 'productList';
  }
}

export function getStoreLocatorPrefix(taskTabName) {
  switch (taskTabName) {
    case TASK_TAB_LIST.UNLOADING:
      return 'stagingLocator';
    case TASK_TAB_LIST.RECEIVING:
      return 'receivingLocator';
    case TASK_TAB_LIST.INSPECTION:
      return ['ngLocator', 'okLocator'];
    case TASK_TAB_LIST.PICKING:
      return 'pickingLocator';
    case TASK_TAB_LIST.PACKING:
      return 'packingLocator';
    case TASK_TAB_LIST.SHIPPING:
      return 'shippingLocator';
    default:
      return 'stagingLocator';
  }
}

export function getStorePrefix(taskTypeName) {
  switch (taskTypeName) {
    case TASK_TAB_LIST.UNLOADING:
      return 'stagingStore';
    case TASK_TAB_LIST.RECEIVING:
      return 'receivingStore';
    case TASK_TAB_LIST.INSPECTION:
      return ['ngStore', 'okStore'];
    case TASK_TAB_LIST.PICKING:
      return 'pickingStore';
    case TASK_TAB_LIST.PACKING:
      return 'packingStore';
    case TASK_TAB_LIST.SHIPPING:
      return 'shippingStore';
    default:
      return 'stagingStore';
  }
}

export function getStoreTypePrefix(taskTypeName) {
  switch (taskTypeName) {
    case TASK_TAB_LIST.UNLOADING:
      return 'staging';
    case TASK_TAB_LIST.RECEIVING:
      return 'receiving';
    case TASK_TAB_LIST.INSPECTION:
      return ['ng', 'ok'];
    case TASK_TAB_LIST.PICKING:
      return 'picking';
    case TASK_TAB_LIST.PACKING:
      return 'packing';
    case TASK_TAB_LIST.SHIPPING:
      return 'shipping';
    default:
      return 'staging';
  }
}

export const onPageChange = async (self, page) => {
  self.setState({
    ...self.state,

    defaultQuery: {
      ...self.state.defaultQuery,
      page: page + 1,
    },
  });
}

export const onPickupByChange = async (self, data) => {
  self.setState({
    ...self.state,

    object: {
      ...self.state.object,

      pickupBy: data,
    },
  });
}

export const onNoteChange = async (self, data) => {
  self.setState({
    ...self.state,

    object: {
      ...self.state.object,

      note: data,
    },
  });
}

export const onOpenPickupMaterialModal = async (self, event, index) => {
  event.preventDefault();

  const { state } = self;
  const { object } = state;
  const { pickupBy, storeId, stockExportSummary, stockExportLineAll } = object;
  const { productId } = stockExportSummary[index]

  if (!pickupBy) {
    Alert.alert(
      i18n.t('notification'),
      i18n.t('pickupByEmpty')
    );

    return;
  }

  const clientContext = getApiContextFromSelf(self, "v1/stockReports");

  const query = {
    storeId,
    productId,
    fields: [
      "location", "lotNo", "lotDate",
      "expirationDate", "qty", "up",
      "storeId", "storeCode", "storeName",
      "storeTypeId", "storeTypeCode", "storeTypeName",
      "warehouseId", "warehouseCode", "warehouseName",
      "companyId", "companyCode", "companyName",
      "departmentId", "departmentCode", "departmentName",
      "productId", "productCode", "productName",
    ],
    sortBy: "expirationDate.asc",
  };

  const { error, data } = await apiGetList(
    "v1/stockReports",
    query,
    clientContext,
  );

  if (error) {
    self.setState({
      loading: false,
      error: true,
      messages: apiErrorMessages(error),
    });

    return;
  }

  const stockList = data.data.map((item) => {
    const {
      _id,
      location, lotNo, lotDate,
      expirationDate, qty, up,
      storeId, storeCode, storeName,
      storeTypeId, storeTypeCode, storeTypeName,
      warehouseId, warehouseCode, warehouseName,
      companyId, companyCode, companyName,
      departmentId, departmentCode, departmentName,
      productId, productCode, productName,
    } = item;

    return {
      _id,
      location, lotNo, lotDate,
      expirationDate, stockQty: qty, up,
      storeId, storeCode, storeName,
      storeTypeId, storeTypeCode, storeTypeName,
      warehouseId, warehouseCode, warehouseName,
      companyId, companyCode, companyName,
      departmentId, departmentCode, departmentName,
      productId, productCode, productName,
    };
  });

  const lineData = _.clone(stockExportSummary[index])
  const exportDetailList = _.clone(stockExportLineAll);

  self.setState({
    ...state,
    object: {
      ...object,

      showPickupMaterialModal: true,
      lineData,
      lineIndex: index,
      stockList,
      exportDetailList,
    },
  });
}

export const onClosePickupMaterialModal = (self) => {
  const { state } = self;
  const { object } = state;

  self.setState({
    ...state,
    object: {
      ...object,
      showPickupMaterialModal: false,
      lineData: null,
      lineIndex: null,
      stockList: [],
    },
  });
}

export const onConfirmationPickupModal = async (self) => {
  const { state } = self;
  const { object } = state;
  const { _id, lineData } = object;
  const { qty, pickedQty } = lineData;

  if (Number(pickedQty) > Number(qty)) {
    Alert.alert(
      i18n.t('notification'),
      i18n.t('pickedQtyExceedsRequestQtyErr')
    );

    return;
  }

  const clientContext = getApiContextFromSelf(self, "v1/stockExports");
  const { error, data } = await apiPost(
    `v1/stockExports/updateLot`,
    object,
    clientContext,
  );

  if (error) {
    Alert.alert(
      i18n.t('notification'),
      apiErrorMessages(error),
    );

    return;
  }

  self.setState({
    ...state,
    object: {
      ...object,
      showPickupMaterialModal: false,
      lineData: null,
      lineIndex: null,
      stockList: [],
    },
  });

  await loadComponentData(self, _id);
}


export const onAutoGetLotChange = (self) => {
  const { state } = self;
  const { object } = state;
  const { lineData } = object;
  const { isAutoGetLot } = lineData;

  self.setState({
    ...state,
    object: {
      ...object,
      lineData: {
        ...lineData,
        isAutoGetLot: !isAutoGetLot,
      },
    },
  });
}

export const onScanProductChange = async (self, data) => {
  const value = data.split(' ');

  const { state } = self;
  const { object } = state;
  const {
    scanStock, lineData,
    exportDetailList,
  } = object;

  let tmpProductCode = '';
  let tmpLocation = '';
  let tmpLotNo = '';
  let tmpQty = '';

  if (value.length === 4) {
    tmpProductCode = value[0];
    tmpLotNo = value[1];
    tmpLocation = value[2];
    tmpQty = value[3];

    self.setState({
      ...self.state,
      object: {
        ...self.state.object,
        scanProductCode: tmpProductCode,
        scanLocation: tmpLocation,
        scanLotNo: tmpLotNo,
        scanQty: tmpQty,
      },
    });

    if (lineData.isAutoGetLot) {
      const { productCode } = lineData;
      if (tmpProductCode !== productCode) {
        Alert.alert(
          i18n.t('notification'),
          i18n.t('scanProductErr')
        );

        return;
      }

      const { location, lotNo, stockQty } = scanStock;
      if (tmpLocation !== location) {
        Alert.alert(
          i18n.t('notification'),
          i18n.t('scanLocationErr')
        );

        return;
      }

      if (tmpLotNo !== lotNo) {
        Alert.alert(
          i18n.t('notification'),
          i18n.t('scanLotNoErr')
        );

        return;
      }

      const currTotalExportQty = exportDetailList.reduce((totalQty, currentValue) =>
        Number(totalQty) + Number(currentValue.qty), 0
      );

      if ((Number(tmpQty) + Number(currTotalExportQty)) > Number(lineData.qty)) {
        Alert.alert(
          i18n.t('notification'),
          i18n.t('scanExceedRequestErr')
        );

        return;
      }

      if (Number(tmpQty) > Number(stockQty)) {
        Alert.alert(
          i18n.t('notification'),
          i18n.t('scanQtyErr')
        );

        return;
      }

      const checkList = exportDetailList.filter(f =>
        f.productCode === tmpProductCode &&
        f.lotNo === tmpLotNo &&
        f.location === tmpLocation
      );

      const totalQty = checkList.reduce((totalQty, currentValue) =>
        Number(totalQty) + Number(currentValue.qty), 0
      );

      if ((Number(stockQty) - Number(totalQty)) < Number(tmpQty)) {
        Alert.alert(
          i18n.t('notification'),
          i18n.t('scanQtyErr')
        );

        return;
      }

      exportDetailList.push({
        originLineId: lineData._id,

        productId: lineData.productId,
        productCode: lineData.productCode,
        productName: lineData.productName,

        productSegmentId: lineData.productSegmentId,
        productSegmentCode: lineData.productSegmentCode,
        productSegmentName: lineData.productSegmentName,

        brandId: lineData.brandId,
        brandCode: lineData.brandCode,
        brandName: lineData.brandName,

        uomId: lineData.uomId,
        uomCode: lineData.uomCode,
        uomName: lineData.uomName,

        customerProductId: lineData.customerProductId,
        customerProductCode: lineData.customerProductCode,
        customerProductName: lineData.customerProductName,

        parentProductId: lineData.parentProductId,
        parentProductCode: lineData.parentProductCode,
        parentProductName: lineData.parentProductName,

        parentUomId: lineData.parentUomId,
        parentUomCode: lineData.parentUomCode,
        parentUomName: lineData.parentUomName,

        conversionRate: lineData.conversionRate,
        isSerialized: lineData.isSerialized,
        isProduct: lineData.isProduct,
        isMaterial: lineData.isMaterial,

        location: scanStock.location,
        lotNo: scanStock.lotNo,
        lotDate: scanStock.lotDate,
        expirationDate: scanStock.expirationDate,
        stockQty: scanStock.stockQty,
        qty: Number(tmpQty),
        up: Number(lineData.up),
        amount: Number(tmpQty) * Number(lineData.up)
      });

      let tmpPickedQty = (Number(lineData.pickedQty) || 0) + Number(tmpQty);

      self.setState({
        ...self.state,
        object: {
          ...self.state.object,
          exportDetailList,
          lineData: {
            ...lineData,
            pickedQty: tmpPickedQty,
          }
        },
      });
    }

  } else {
    tmpProductCode = data;

    self.setState({
      ...self.state,
      object: {
        ...self.state.object,
        scanProductCode: tmpProductCode,
      },
    });
  }
}

export const onScanQtyChange = async (self, data) => {
  self.setState({
    ...self.state,
    object: {
      ...self.state.object,
      scanQty: data,
    },
  });
}

export const onScanLocationChange = async (self, data) => {
  self.setState({
    ...self.state,
    object: {
      ...self.state.object,
      scanLocation: data,
    },
  });
}

export const onScanLotNoChange = async (self, data) => {
  self.setState({
    ...self.state,
    object: {
      ...self.state.object,
      scanLotNo: data,
    },
  });
}

export const onPickScanMaterialChange = async (self) => {
  const { state } = self;
  const { object } = state;
  const {
    scanStock, lineData,
    exportDetailList,
    scanProductCode, scanLocation,
    scanLotNo, scanQty
  } = object;

  const { productCode } = lineData;
  if (scanProductCode !== productCode) {
    Alert.alert(
      i18n.t('notification'),
      i18n.t('scanProductErr')
    );

    return;
  }

  const { location, lotNo, stockQty } = scanStock;
  if (scanLocation !== location) {
    Alert.alert(
      i18n.t('notification'),
      i18n.t('scanLocationErr')
    );

    return;
  }

  if (scanLotNo !== lotNo) {
    Alert.alert(
      i18n.t('notification'),
      i18n.t('scanLotNoErr')
    );

    return;
  }

  const currTotalExportQty = exportDetailList.reduce((totalQty, currentValue) =>
    Number(totalQty) + Number(currentValue.qty), 0
  );

  if ((Number(scanQty) + Number(currTotalExportQty)) > Number(lineData.qty)) {
    Alert.alert(
      i18n.t('notification'),
      i18n.t('scanExceedRequestErr')
    );

    return;
  }

  if (Number(scanQty) > Number(stockQty)) {
    Alert.alert(
      i18n.t('notification'),
      i18n.t('scanQtyErr')
    );

    return;
  }

  const checkList = exportDetailList.filter(f =>
    f.productCode === scanProductCode &&
    f.lotNo === scanLotNo &&
    f.location === scanLocation
  );

  const totalQty = checkList.reduce((totalQty, currentValue) =>
    Number(totalQty) + Number(currentValue.qty), 0
  );

  if (Number(stockQty) - Number(totalQty) < Number(scanQty)) {
    Alert.alert(
      i18n.t('notification'),
      i18n.t('scanQtyErr')
    );

    return;
  }

  exportDetailList.push({
    originLineId: lineData._id,

    productId: lineData.productId,
    productCode: lineData.productCode,
    productName: lineData.productName,

    productSegmentId: lineData.productSegmentId,
    productSegmentCode: lineData.productSegmentCode,
    productSegmentName: lineData.productSegmentName,

    brandId: lineData.brandId,
    brandCode: lineData.brandCode,
    brandName: lineData.brandName,

    uomId: lineData.uomId,
    uomCode: lineData.uomCode,
    uomName: lineData.uomName,

    customerProductId: lineData.customerProductId,
    customerProductCode: lineData.customerProductCode,
    customerProductName: lineData.customerProductName,

    parentProductId: lineData.parentProductId,
    parentProductCode: lineData.parentProductCode,
    parentProductName: lineData.parentProductName,

    parentUomId: lineData.parentUomId,
    parentUomCode: lineData.parentUomCode,
    parentUomName: lineData.parentUomName,

    conversionRate: lineData.conversionRate,
    isSerialized: lineData.isSerialized,
    isProduct: lineData.isProduct,
    isMaterial: lineData.isMaterial,

    location: scanStock.location,
    lotNo: scanStock.lotNo,
    lotDate: scanStock.lotDate,
    expirationDate: scanStock.expirationDate,
    stockQty: scanStock.stockQty,
    qty: Number(scanQty),
    up: Number(lineData.up),
    amount: Number(scanQty) * Number(lineData.up)
  });

  let tmpPickedQty = (Number(lineData.pickedQty) || 0) + Number(scanQty);

  self.setState({
    ...self.state,
    object: {
      ...self.state.object,
      exportDetailList,
      lineData: {
        ...lineData,
        pickedQty: tmpPickedQty,
      },
      scanProductCode: "",
      scanLocation: "",
      scanLotNo: "",
      scanQty: ""
    },
  });
}

export const onDeleteExportDetailLine = async (self, index) => {
  const { state } = self;
  const { object } = state;
  const { exportDetailList, lineData } = object;

  const newPickedQty = Number(lineData.pickedQty) - Number(exportDetailList[index].qty)
  exportDetailList.splice(index, 1);

  self.setState({
    ...self.state,
    object: {
      ...self.state.object,
      lineData: {
        ...lineData,
        pickedQty: newPickedQty,
      }
    },
  });
}

export const onCloseSearchModal = (self) => {
  const { state } = self;
  const { object, modalSearch } = state;

  self.setState({
    ...state,
    object: {
      ...object,
    },
    modalSearch: false
  });
}

export const onOpenSearchModal = (self) => {
  const { state } = self;
  const { object } = state;

  self.setState({
    ...state,
    object: {
      ...object,
    },
    modalSearch: true
  });
}

export const onEmployeeSelectionChange = async (self, itemValue) => {
  const newState = _.cloneDeep(self.state);
  const { object, pageLoad } = newState;
  const employeeListOptions = pageLoad.employeeId.data
  const employeeSelected = employeeListOptions.find(e => e._id === itemValue)

  self.setState({
    ...pageLoad,
    object: {
      ...object,
      employeeId: employeeSelected._id,
      employeeCode: employeeSelected.employeeCode,
      employeeName: employeeSelected.employeeName,
    },
  });
};

export const onStagingLocatorSelectionChange = async (self, itemValue) => {
  const newState = _.cloneDeep(self.state);
  const { object, pageLoad } = newState;
  const stagingLocatorListOptions = pageLoad.stagingLocatorId.data
  const stagingLocatorSelected = stagingLocatorListOptions.find(e => e._id === itemValue)

  self.setState({
    ...pageLoad,
    object: {
      ...object,
      stagingLocatorId: stagingLocatorSelected._id,
      stagingLocatorCode: stagingLocatorSelected.stagingLocatorCode,
      stagingLocatorName: stagingLocatorSelected.stagingLocatorName,
    },
  });
};

export const onPackingStagingLocatorSelectionChange = async (self, itemValue) => {
  const newState = _.cloneDeep(self.state);
  const { object, pageLoad } = newState;
  const packingStagingLocatorListOptions = pageLoad.packingStagingLocatorId.data
  const packingStagingLocatorSelected = packingStagingLocatorListOptions.find(e => e._id === itemValue)

  self.setState({
    ...pageLoad,
    object: {
      ...object,
      packingStagingLocatorId: packingStagingLocatorSelected._id,
      packingStagingLocatorCode: packingStagingLocatorSelected.packingStagingLocatorCode,
      packingStagingLocatorName: packingStagingLocatorSelected.packingStagingLocatorName,
    },
  });
};


export const onPackingUnitTypeCurrentSelectionChange = async (self, itemValue) => {
  const newState = _.cloneDeep(self.state);
  const { object, pageLoad } = newState;
  const packingUnitTypeCurrentListOptions = pageLoad.packingUnitTypeIdCurrent.data
  const packingUnitTypeCurrentSelected = packingUnitTypeCurrentListOptions.find(e => e._id === itemValue)

  self.setState({
    ...pageLoad,
    object: {
      ...object,
      packingUnitTypeIdCurrent: packingUnitTypeCurrentSelected._id,
      packingUnitTypeCodeCurrent: packingUnitTypeCurrentSelected.packingUnitTypeCode,
      packingUnitTypeNameCurrent: packingUnitTypeCurrentSelected.packingUnitTypeName,
    },
  });
};

export const onNextFieldRefChange = (self, focusToField) => {
  try {
    if (focusToField) {
      self[focusToField].current.focus();
    }
  } catch (error) {
  }
};

export const onNextObjectFieldRefChange = (self, focusToField, objectName) => {
  if (focusToField) {
    self[`${objectName}Ref`][focusToField].current.focus();
  }
};

export const onNextGridFieldRefChange = (self, focusToField, taskTab) => {
  try {
    if (focusToField) {
      self[`${taskTab}_fieldRefList`][focusToField].current.focus();
    }
  } catch (error) {
  }
};

export const onNextFlatFieldRefChange = (self, focusToField, taskTab) => {
  try {
    if (focusToField) {
      self[`${taskTab}_flatFieldList`][focusToField].current.focus();
    }
  } catch (error) {
  }
};

export const onPackingUnitCodeChange = async (self, itemValue, itemName, focusToField) => {
  try {
    const { object, pageLoad } = self.state;

    self.setState({
      object: {
        ...object,
        [itemName]: itemValue
      },
    });
  } catch (error) {
    console.log("🚀 ~ onPackingUnitCodeChange ~ error:", error)
  }
};

export const onLotNoReceivingTaskChange = async (self, itemValue, itemName, focusToField) => {
  try {
    const newState = self.state;
    const { object, pageLoad, refModels } = newState;

    // self.setState({
    //   ...newState,
    //   object: {
    //     ...object,
    //     [itemName]: itemValue
    //   },
    // });
    object[itemName] = itemValue;

    const newObject = cloneDeep(object)
    const { taskTypeName, productList } = newObject;

    const taskName = itemName.split('_')[0];
    const taskTabListName = self[`${taskName}_gridListName`] === 'inspectionResult' ? 'okProductList' : self[`${taskName}_gridListName`];

    const clientContext = getApiContextFromSelf(self, newObject.taskTypeName);

    const { relatedFields, fieldName, query } = refModels.find((f) => f.fieldName === `${taskTabListName}.productId`);

    if (!isObjectId(newObject[`${taskName}_productId`])) {
      self.setState({
        ...newState,
        loading: false,
        errorScan: `${i18n.t('product')}: ${i18n.t('isRequired')}`,
      });

      return;
    }

    const productItem = productList.find(p => isEqual(p.productCode, newObject[`${taskName}_productCode`]) && isEqual(p.lotNo, newObject[itemName]));

    if (!productItem) {
      self.setState({
        ...newState,
        errorScan: `${i18n.t('incorrectLotNoScanned')}`,
        object: {
          ...newObject,
          // ...updatedFields,
        },
      });

      return;
    }

    newObject[`${itemName}Id`] = productItem._id;
    newObject[`${taskName}_originLineId`] = productItem._id;
    newObject[`${taskName}_lotNo`] = productItem.lotNo ? productItem.lotNo : '';
    newObject[`${taskName}_lotDate`] = productItem.lotDate ? new Date(productItem.lotDate) : new Date();
    newObject[`${taskName}_expDate`] = productItem.expDate ? new Date(productItem.expDate) : new Date();
    newObject[`${taskName}_qty`] = productItem.qty ? Number(productItem.qty) : 0;

    if (relatedFields) {
      relatedFields.forEach((field) => {
        if (isObject(field)) {
          const { fromField, toField } = field;

          if (toField) {
            newObject[`${taskName}_${toField}`] = _.isUndefined(productItem[fromField]) ? '' : productItem[fromField];
          }
        } else {
          newObject[`${taskName}_${field}`] = _.isUndefined(productItem[field]) ? '' : productItem[field];
        }
      });
    }

    self.setState({
      ...newState,
      object: {
        ...newObject,
        // ...updatedFields,
      },
      errorScan: ``,
    });

  } catch (error) {
    console.log("🚀 ~ onPackingUnitCodeChange ~ error:", error)
  }
};

export const onPackingUnitCodeSubmit = async (self, itemName, focusToField, taskTab) => {
  try {
    const { object, refModels, autoCreatePackingUnitCode, isOkProductList } = self.state;
    let gridListName = self[`${taskTab}_gridListName`];

    if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && isOkProductList) {
      gridListName = 'okProductList';
    } else if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
      gridListName = 'ngProductList';
    }

    const gridFieldList = self[`${taskTab}_tmpGridFieldList`];
    const packingUnitKey = itemName.slice(taskTab.length + 1); // Bỏ tiền tố "receiving_"
    const field = gridFieldList.find(g => g.fieldName == packingUnitKey && !g.hide)

    if (field && field.mayBeRequired && autoCreatePackingUnitCode) {
      if (focusToField) {
        if (self[`${taskTab}_fieldRefList`][focusToField]) {
          self[`${taskTab}_fieldRefList`][focusToField].current.focus();
        }
      }
    } else {
      const clientContext = getApiContextFromSelf(self, object.taskTypeName);

      const { relatedFields, fieldName, query } = refModels.find((f) => f.fieldName === `${gridListName}.${packingUnitKey}Id`);

      query.packingUnitCode = { $eq: object[itemName] };

      const { error, data } = await apiGetList('v1/packingUnits', query, clientContext);

      if (error) {
        self.setState({
          ...self.state,
          errorScan: `cannotGetPackingUnit`,
        });

        return;
      }

      const packingUnitItem = data.data;
      const taskName = itemName.substring(0, itemName.indexOf("_") + 1);

      if (packingUnitItem.length === 1) {

        object[`${itemName}Id`] = packingUnitItem[0]._id;

        if (relatedFields) {
          relatedFields.forEach((field) => {
            if (isObject(field)) {
              const { fromField, toField } = field;

              if (toField) {
                object[`${taskName}${toField}`] = packingUnitItem[0] ? packingUnitItem[0][fromField] : '';
              }
            } else {
              object[`${taskName}${field}`] = packingUnitItem[0] ? packingUnitItem[0][field] : '';
            }
          });
        }
      } else {
        if (relatedFields) {
          relatedFields.forEach((field) => {
            if (isObject(field)) {
              const { fromField, toField } = field;

              if (toField) {
                object[`${taskName}${toField}`] = '';
              }
            } else {
              object[`${taskName}${field}`] = '';
            }
          });
        }
      }

      if (!packingUnitItem.length) {
        self.setState({
          ...self.state,
          errorScan: `${i18n.t('packingUnitCode')} ${i18n.t('notExisting')}`,
          object: {
            ...object,
          },
        });

        return;
      }

      self.setState({
        ...self.state,
        object: {
          ...object,
        },
        errorScan: ``,
      });

      if (packingUnitItem.length === 1 && focusToField) {
        if (self[`${taskTab}_fieldRefList`][focusToField]) {
          self[`${taskTab}_fieldRefList`][focusToField].current.focus();
        }
      }
    }
  } catch (error) {
    console.log("🚀 ~ onPackingUnitCodeSubmit ~ error:", error)
  }
};

export const onPackingUnitCodeSubmitInspectionTask = async (self, itemName, focusToField, taskTab) => {
  try {
    const { object, refModels } = self.state;
    const taskTabListName = self[`${taskTab}_gridListName`] === 'inspectionResult' ? 'okProductList' : self[`${taskTab}_gridListName`];
    const packingUnitKey = itemName.slice(taskTab.length + 1); // Bỏ tiền tố "receiving_"

    const clientContext = getApiContextFromSelf(self, object.taskTypeName);

    const { relatedFields, fieldName, query } = refModels.find((f) => f.fieldName === `${taskTabListName}.${packingUnitKey}Id`);

    query.packingUnitCode = { $eq: object[itemName] };

    const { error, data } = await apiGetList('v1/packingUnits', query, clientContext);

    if (error) {
      self.setState({
        ...self.state,
        errorScan: `cannotGetPackingUnit`,
      });

      return;
    }

    const packingUnitItem = data.data;
    const taskName = itemName.substring(0, itemName.indexOf("_") + 1);

    if (packingUnitItem.length === 1) {

      object[`${itemName}Id`] = packingUnitItem[0]._id;

      if (relatedFields) {
        relatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = packingUnitItem[0] ? packingUnitItem[0][fromField] : '';
            }
          } else {
            object[`${taskName}${field}`] = packingUnitItem[0] ? packingUnitItem[0][field] : '';
          }
        });
      }
    } else {
      if (relatedFields) {
        relatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = '';
            }
          } else {
            object[`${taskName}${field}`] = '';
          }
        });
      }
    }

    if (!packingUnitItem.length) {
      self.setState({
        ...self.state,
        errorScan: `${i18n.t('packingUnitCode')} ${i18n.t('notExisting')}`,
        object: {
          ...object,
        },
      });

      return;
    }

    self.setState({
      ...self.state,
      object: {
        ...object,
      },
      errorScan: ``,
    });

    if (packingUnitItem.length === 1 && focusToField) {
      if (self[`${taskTab}_fieldRefList`][focusToField]) {
        self[`${taskTab}_fieldRefList`][focusToField].current.focus();
      }
    }
  } catch (error) {
    console.log("🚀 ~ onPackingUnitCodeSubmitInspectionTask ~ error:", error)
  }
};

export const onPackingUnitCodeSubmitScannedTask = async (self, itemName, focusToField, taskTab) => {
  try {
    const { object, refModels } = self.state;
    const { receivingList } = object;
    const taskTabListName = self[`${taskTab}_gridListName`] === 'inspectionResult' ? 'okProductList' : self[`${taskTab}_gridListName`];
    const packingUnitKey = itemName.slice(taskTab.length + 1); // Bỏ tiền tố "receiving_"

    const clientContext = getApiContextFromSelf(self, object.taskTypeName);

    const { relatedFields: packingUnitRelatedFields, fieldName: packingUnitFieldName, query: packingUnitQuery } = refModels.find((f) => f.fieldName === `${taskTabListName}.${packingUnitKey}Id`);
    const { relatedFields: productRelatedFields, fieldName: productFieldName, query: productQuery } = refModels.find((f) => f.fieldName === `${taskTabListName}.productId`);

    const packingUnitItemSelected = receivingList.find(r => r.packingUnitCode === object[itemName]);

    if (!packingUnitItemSelected) {
      self.setState({
        ...self.state,
        errorScan: `${i18n.t('packingUnitNotFoundInReceivingList')}`,
      });

      return;
    }

    const packingUnitItem = receivingList.find(r => r.packingUnitCode === object[itemName]);
    const taskName = itemName.substring(0, itemName.indexOf("_") + 1);

    if (packingUnitItem) {

      object[`${itemName}Id`] = packingUnitItem._id;

      if (packingUnitRelatedFields) {
        packingUnitRelatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = packingUnitItem ? packingUnitItem[fromField] : '';
            }
          } else {
            object[`${taskName}${field}`] = packingUnitItem ? packingUnitItem[field] : '';
          }
        });
      }

      if (productRelatedFields) {
        object[`${taskName}productId`] = packingUnitItem._id;
        object[`${taskName}product`] = packingUnitItem.productCode;
        object[`${taskName}lotNo`] = packingUnitItem.lotNo;

        productRelatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = packingUnitItem ? packingUnitItem[fromField] : '';
            }
          } else {
            object[`${taskName}${field}`] = packingUnitItem ? packingUnitItem[field] : '';
          }
        });
      }
    } else {
      if (packingUnitRelatedFields) {
        object[`${itemName}Id`] = null;

        packingUnitRelatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = '';
            }
          } else {
            object[`${taskName}${field}`] = '';
          }
        });
      }

      if (productRelatedFields) {
        object[`${taskName}productId`] = null;
        object[`${taskName}product`] = null;
        object[`${taskName}lotNo`] = '';

        productRelatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = '';
            }
          } else {
            object[`${taskName}${field}`] = '';
          }
        });
      }
    }

    const productAttributeList = object[`${taskName}productAttributeList`];

    if (productAttributeList && productAttributeList.length) {
      for (const productAttribute of productAttributeList) {
        const { productAttributeId, productAttributeCode, productAttributeName } = productAttribute;

        const gridFieldList = self[`${taskTab}_tmpGridFieldList`];
        gridFieldList.push({
          fieldName: productAttributeCode,
          type: "string",
          inputType: "TextInput",
          focusToField: "",
          isRequired: true
        })
      }
    }

    if (!packingUnitItem) {
      self.setState({
        ...self.state,
        errorScan: `${i18n.t('packingUnitCode')} ${i18n.t('notExisting')}`,
        object: {
          ...object,
        },
      });

      return;
    }

    self.setState({
      ...self.state,
      object: {
        ...object,
      },
      errorScan: ``,
    });

    if (packingUnitItem.length === 1 && focusToField) {
      if (self[`${taskTab}_fieldRefList`][focusToField]) {
        self[`${taskTab}_fieldRefList`][focusToField].current.focus();
      }
    }
  } catch (error) {
  }
};

export const onPackingUnitCodeSubmitPutAwayTask = async (self, itemName, focusToField, taskTab) => {
  try {
    const { object, refModels } = self.state;
    const {
      receivingList,
      outputTaskTabList, currentTaskIndex, taskIndex,
      taskList
    } = object;
    const taskTabListName = self[`${taskTab}_gridListName`] === 'inspectionResult' ? 'okProductList' : self[`${taskTab}_gridListName`];
    const packingUnitKey = itemName.slice(taskTab.length + 1); // Bỏ tiền tố "receiving_"

    const clientContext = getApiContextFromSelf(self, object.taskTypeName);

    const { relatedFields: packingUnitRelatedFields, fieldName: packingUnitFieldName, query: packingUnitQuery } = refModels.find((f) => f.fieldName === `${taskTabListName}.${packingUnitKey}Id`);
    const { relatedFields: productRelatedFields, fieldName: productFieldName, query: productQuery } = refModels.find((f) => f.fieldName === `${taskTabListName}.productId`);

    let curTaskTab = outputTaskTabList[currentTaskIndex];
    let preTaskTab = outputTaskTabList[currentTaskIndex - 1];

    if (currentTaskIndex === outputTaskTabList.length) {
      curTaskTab = outputTaskTabList[currentTaskIndex - 1];
      preTaskTab = outputTaskTabList[currentTaskIndex - 2];
    }

    let curTaskTabName = curTaskTab ? curTaskTab.taskTab : '';
    let preTaskTabName = preTaskTab ? preTaskTab.taskTab : '';
    let isFirstTaskTab = outputTaskTabList[0].taskTab === curTaskTabName;

    if (!preTaskTabName) {
      const preTask = taskList[taskIndex - 1];
      const preTaskOutputTaskTabList = preTask ? preTask.outputTaskTabList : [];
      const lastTaskTabOfPreTask = preTaskOutputTaskTabList[preTaskOutputTaskTabList.length - 1];
      preTaskTabName = lastTaskTabOfPreTask ? lastTaskTabOfPreTask.taskTab : '';
    }

    const preProductList = [];
    const preProductListName = getProductListByTaskTab(preTaskTabName);

    if (isString(preProductListName)) {
      preProductList.push(...object[preProductListName]);
    }

    if (isArray(preProductListName)) {
      preProductList.push(
        ...object[preProductListName[0]],
        ...object[preProductListName[1]],
      );
    }

    const packingUnitItem = preProductList.find(r => r.packingUnitCode === object[itemName]);
    const taskName = itemName.substring(0, itemName.indexOf("_") + 1);

    if (packingUnitItem) {

      object[`${itemName}Id`] = packingUnitItem._id;

      if (packingUnitRelatedFields) {
        packingUnitRelatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = packingUnitItem ? packingUnitItem[fromField] : '';
            }
          } else {
            object[`${taskName}${field}`] = packingUnitItem ? packingUnitItem[field] : '';
          }
        });
      }

      if (productRelatedFields) {
        object[`${taskName}productId`] = packingUnitItem._id;
        object[`${taskName}product`] = packingUnitItem.productCode;
        object[`${taskName}lotNo`] = packingUnitItem.lotNo;
        object[`${taskName}lotDate`] = new Date(packingUnitItem.lotDate);
        object[`${taskName}expDate`] = new Date(packingUnitItem.expDate);
        object[`${taskName}qty`] = packingUnitItem.qty;

        productRelatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = packingUnitItem ? packingUnitItem[fromField] : '';
            }
          } else {
            object[`${taskName}${field}`] = packingUnitItem ? packingUnitItem[field] : '';
          }
        });
      }
    } else {
      if (packingUnitRelatedFields) {
        object[`${itemName}Id`] = null;

        packingUnitRelatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = '';
            }
          } else {
            object[`${taskName}${field}`] = '';
          }
        });
      }

      if (productRelatedFields) {
        object[`${taskName}productId`] = null;
        object[`${taskName}product`] = null;
        object[`${taskName}lotNo`] = '';
        object[`${taskName}lotDate`] = null;
        object[`${taskName}expDate`] = null;
        object[`${taskName}qty`] = 0;

        productRelatedFields.forEach((field) => {
          if (isObject(field)) {
            const { fromField, toField } = field;

            if (toField) {
              object[`${taskName}${toField}`] = '';
            }
          } else {
            object[`${taskName}${field}`] = '';
          }
        });
      }
    }

    const productAttributeList = object[`${taskName}productAttributeList`];

    if (productAttributeList && productAttributeList.length) {
      for (const productAttribute of productAttributeList) {
        const { productAttributeId, productAttributeCode, productAttributeName } = productAttribute;

        const gridFieldList = self[`${taskTab}_tmpGridFieldList`];
        gridFieldList.push({
          fieldName: productAttributeCode,
          type: "string",
          inputType: "TextInput",
          focusToField: "",
          isRequired: true
        })
      }
    }

    if (!packingUnitItem) {
      self.setState({
        ...self.state,
        errorScan: `${i18n.t('packingUnitCode')} ${i18n.t('notExisting')}`,
        object: {
          ...object,
        },
      });

      return;
    }

    self.setState({
      ...self.state,
      object: {
        ...object,
      },
      errorScan: ``,
    });

    if (packingUnitItem.length === 1 && focusToField) {
      if (self[`${taskTab}_fieldRefList`][focusToField]) {
        self[`${taskTab}_fieldRefList`][focusToField].current.focus();
      }
    }
  } catch (error) {
    console.log("🚀 ~ onPackingUnitCodeSubmitPutAwayTask ~ error:", error)
  }
};

export const onProductChange = async (self, itemValue, itemName, taskTab) => {
  try {
    const { object, pageLoad } = self.state;

    self.setState({
      object: {
        ...object,
        [itemName]: itemValue
      },
    });
  } catch (error) {
  }
};


export const onChangeTextTable = async (self, tableList, fieldName, index, value) => {
  try {
    const newState = cloneDeep(self.state)
    const { object, pageLoad } = newState;
    const vehicleList = object[tableList];
    vehicleList[index][fieldName] = value;
    self.setState({
      ...newState,
      object: {
        ...object,
        vehicleList,
      },
    });
  } catch (error) {
    console.log('onChangeTextTable', JSON.stringify(error, null, 2))
  }
};


export const onChangeTableVehicleShippingList = async (self, index, value) => {

  try {
    const newState = cloneDeep(self.state);
    const { object } = newState;
    const clientContext = getApiContextFromSelf(self);

    const vehicleList = [...object['vehicleList']];

    const { data: { data: vehicle } } = await apiGetById(
      'v1/vehicles',
      value.key,
      [],
      false,
      clientContext
    );

    vehicleList[index] = {
      ...vehicleList[index],
      ...vehicle,
      vehicleId: value.key,
    };

    self.setState({
      ...newState,
      object: {
        ...object,
        vehicleList,
      },
    });
  } catch (error) {
    console.log('onChangeTextTable', JSON.stringify(error, null, 2));
  }
};




export const onProductCodeSubmit = async (self, itemName, focusToField, taskTab) => {
  try {
    const { object, refModels } = self.state;
    const { taskTypeName, productList } = object;

    const packingUnitKey = itemName.slice(taskTab.length + 1); // Bỏ tiền tố "receiving_"
    const taskTabListName = self[`${taskTab}_gridListName`] === 'inspectionResult' ? 'okProductList' : self[`${taskTab}_gridListName`];

    const clientContext = getApiContextFromSelf(self, object.taskTypeName);

    const { relatedFields, fieldName, query } = refModels.find((f) => f.fieldName === `${taskTabListName}.${packingUnitKey}Id`);

    const productItem = productList.find(p => isEqual(p.productCode, object[itemName]));

    if (!productItem) {
      self.setState({
        ...self.state,
        errorScan: `${i18n.t('incorrectProductScanned')}`,
        object: {
          ...object,
          // ...updatedFields,
        },
      });

      return;
    }

    object[`${itemName}Id`] = productItem.productId;
    object[`${taskTab}_originLineId`] = productItem._id;
    object[`${taskTab}_lotNo`] = productItem.lotNo ? productItem.lotNo : '';
    object[`${taskTab}_lotDate`] = productItem.lotDate ? new Date(productItem.lotDate) : new Date();
    object[`${taskTab}_expDate`] = productItem.expDate ? new Date(productItem.expDate) : new Date();
    object[`${taskTab}_qty`] = productItem.qty ? Number(productItem.qty) : 0;

    if (relatedFields) {
      relatedFields.forEach((field) => {
        if (isObject(field)) {
          const { fromField, toField } = field;

          if (toField) {
            object[`${taskTab}_${toField}`] = productItem ? productItem[fromField] : '';
          }
        } else {
          object[`${taskTab}_${field}`] = productItem ? productItem[field] : '';
        }
      });
    }

    self.setState({
      object: {
        ...object,
        // ...updatedFields,
      },
      errorScan: ``,
    });


    if (productItem && focusToField) {
      if (self[`${taskTab}_fieldRefList`][focusToField]) {
        self[`${taskTab}_fieldRefList`][focusToField].current.focus();
      }
    }
  } catch (error) {
    console.log("🚀 ~ onProductCodeSubmit ~ error:", error)
  }
};

export const onLotNoSubmit = async (self, itemName, focusToField, taskTab) => {
  try {
    const { object, refModels } = self.state;
    const newObject = cloneDeep(object)
    const { taskTypeName, productList } = newObject;

    const packingUnitKey = itemName.slice(taskTab.length + 1); // Bỏ tiền tố "receiving_"
    const taskTabListName = self[`${taskTab}_gridListName`] === 'inspectionResult' ? 'okProductList' : self[`${taskTab}_gridListName`];

    const clientContext = getApiContextFromSelf(self, newObject.taskTypeName);

    const { relatedFields, fieldName, query } = refModels.find((f) => f.fieldName === `${taskTabListName}.productId`);

    if (!isObjectId(newObject[`${taskTab}_productId`])) {
      self.setState({
        ...self.state,
        loading: false,
        errorScan: `${i18n.t('product')}: ${i18n.t('isRequired')}`,
      });

      return;
    }

    const productItem = productList.find(p => isEqual(p.productCode, newObject[`${taskTab}_productCode`]) && isEqual(p.lotNo, newObject[itemName]));

    if (!productItem) {
      self.setState({
        ...self.state,
        errorScan: `${i18n.t('incorrectLotNoScanned')}`,
        object: {
          ...newObject,
          // ...updatedFields,
        },
      });

      return;
    }

    newObject[`${itemName}Id`] = productItem._id;
    newObject[`${taskTab}_originLineId`] = productItem._id;
    newObject[`${taskTab}_lotNo`] = productItem.lotNo ? productItem.lotNo : '';
    newObject[`${taskTab}_lotDate`] = productItem.lotDate ? new Date(productItem.lotDate) : new Date();
    newObject[`${taskTab}_expDate`] = productItem.expDate ? new Date(productItem.expDate) : new Date();
    newObject[`${taskTab}_qty`] = productItem.qty ? Number(productItem.qty) : 0;

    if (relatedFields) {
      relatedFields.forEach((field) => {
        if (isObject(field)) {
          const { fromField, toField } = field;

          if (toField) {
            newObject[`${taskTab}_${toField}`] = _.isUndefined(productItem[fromField]) ? '' : productItem[fromField];
          }
        } else {
          newObject[`${taskTab}_${field}`] = _.isUndefined(productItem[field]) ? '' : productItem[field];
        }
      });
    }

    self.setState({
      ...self.state,
      object: {
        ...newObject,
        // ...updatedFields,
      },
      errorScan: ``,
    });


    if (productItem && focusToField) {
      if (self[`${taskTab}_fieldRefList`][focusToField]) {
        self[`${taskTab}_fieldRefList`][focusToField].current.focus();
      }
    }
  } catch (error) {
    console.log("🚀 ~ onLotNoSubmit ~ error:", error)
  }
};

export const onStoreLocatorCodeSubmitPutAwayTask = async (self, itemName, focusToField, taskTab) => {
  try {
    const { object, refModels } = self.state;
    const { taskTypeName, productList } = object;

    const fieldKey = itemName.slice(taskTab.length + 1); // Bỏ tiền tố "receiving_"
    const taskTabListName = self[`${taskTab}_gridListName`] === 'inspectionResult' ? 'okProductList' : self[`${taskTab}_gridListName`];

    const clientContext = getApiContextFromSelf(self, object.taskTypeName);

    const { relatedFields, fieldName, query } = refModels.find((f) => f.fieldName === `${taskTabListName}.${fieldKey}Id`);
    query.storeLocatorCode = { $eq: object[itemName] };
    // query.isInventory = true;

    const { error, data } = await apiGetList('v1/storeLocators', query, clientContext);
    if (error) {
      self.setState({
        loading: false,
        error: true,
        errorScan: apiErrorMessages(error),
      });

      return;
    }

    const storeLocatorList = data.data;
    if (!storeLocatorList.length) {
      self.setState({
        ...self.state,
        errorScan: `${i18n.t('storeLocator')} ${object[itemName]} ${i18n.t('notExisting')}`,
      });

      return;
    }

    const storeLocatorSeleted = storeLocatorList.find(s => s.isInventory);
    if (!storeLocatorSeleted) {
      self.setState({
        ...self.state,
        errorScan: `${i18n.t('storeLocator')} ${object[itemName]} ${i18n.t('msg.validate.failure')}`,
      });

      return;
    }

    object[`${itemName}Id`] = storeLocatorSeleted._id;

    if (relatedFields) {
      relatedFields.forEach((field) => {
        if (isObject(field)) {
          const { fromField, toField } = field;

          if (toField) {
            object[`${taskTab}_${toField}`] = storeLocatorSeleted ? storeLocatorSeleted[fromField] : '';
          }
        } else {
          object[`${taskTab}_${field}`] = storeLocatorSeleted ? storeLocatorSeleted[field] : '';
        }
      });
    }

    self.setState({
      object: {
        ...object,
        // ...updatedFields,
      },
      errorScan: ``,
    });


    if (taskTab && focusToField) {
      if (self[`${taskTab}_fieldRefList`][focusToField]) {
        self[`${taskTab}_fieldRefList`][focusToField].current.focus();
      }
    }
  } catch (error) {
  }
};

export const onCloseSearchPackingUnitModal = (self) => {
  const { state } = self;
  const { object } = state;

  self.setState({
    ...state,
    object: {
      ...object,
    },
    modalSearchPackingUnit: false
  });
}

export const onOpenSearchPackingUnitModal = (self) => {
  const { state } = self;
  const { object } = state;

  self.setState({
    ...state,
    object: {
      ...object,
    },
    modalSearchPackingUnit: true
  });
}

export const onCloseSearchProductModal = (self) => {
  const { state } = self;
  const { object } = state;

  self.setState({
    keySearch: {},
    modalSearchProduct: false
  });
}

export const onCloseSearchGridModal = (self) => {
  const { state } = self;
  const { object } = state;

  self.setState({
    keySearch: {},
    modalSearchGrid: false
  });
}


export const onOpenSearchProductModal = (self) => {
  const { state } = self;
  const { object } = state;

  self.setState({
    ...state,
    object: {
      ...object,
    },
    modalSearchProduct: true
  });
}

export const onOpenSearchGridModal = (self) => {
  const { state } = self;

  self.setState({
    ...state,
    modalSearchGrid: true
  });
}

export const onOpenSearchPickInstructionListModal = (self) => {
  const { state } = self;

  self.setState({
    ...state,
    modalSearchGrid: true,
    pickInstructionListSearchModalState: true,
  });
}

export const onOpenSearchOkProductListModal = (self) => {
  const { state } = self;

  self.setState({
    ...state,
    modalSearchGrid: true,
    isOkProductList: true,
  });
}

export const onOpenSearchNgProductListModal = (self) => {
  const { state } = self;

  self.setState({
    ...state,
    modalSearchGrid: true,
    isOkProductList: false,
  });
}

export const onResetSearchModal = (self) => {
  self.setState({
    keySearch: {},
  });
};

export const onResetGroupBySearchModal = (self) => {
  self.setState({
    keySearch: {},
  });
};

export const onSearchProduct = (self) => {
  const { object, keySearch } = self.state;
  const { originalProductList } = object;

  if (!keySearch.productCode && !keySearch.productName) {
    self.setState({
      object: {
        ...object,
        productList: originalProductList,
      },
      modalSearchProduct: false,
    });
    return;
  }

  const filteredProductList = originalProductList.filter((item) => {
    return (
      (!keySearch.productCode || item.productCode.toLowerCase().includes(keySearch.productCode.toLowerCase())) &&
      (!keySearch.productName || item.productName.toLowerCase().includes(keySearch.productName.toLowerCase()))
    );
  });

  self.setState({
    object: {
      ...object,
      productList: filteredProductList,
    },
    modalSearchProduct: false,
  });
};

export const onSearchList = (self) => {
  const { keySearch, objectListFullState } = self.state;

  let { fromDate, toDate, taskCode, customerId, state } = keySearch;
  const { originalDataList } = objectListFullState;

  const keyFromDate = fromDate ? new Date(new Date(fromDate).setHours(0, 0, 0, 0)) : null;
  const keyToDate = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;

  const dataList = originalDataList.filter((item) => {
    const itemRequestedAt = new Date(item.requestedAt);

    return (
      (!taskCode || item.taskCode.toLowerCase().includes(taskCode.toLowerCase())) &&
      (!customerId || item.customerId.toLowerCase() === customerId.toLowerCase()) &&
      (!state || item.state.toLowerCase() === state.toLowerCase()) &&
      (!keyFromDate || keyFromDate <= itemRequestedAt) &&
      (!keyToDate || keyToDate >= itemRequestedAt)
    );
  });

  self.setState({
    objectList: {
      ...objectListFullState,
      data: dataList,
    },
    modalSearch: false,
  });
};


export const onResetSearch = (self) => {
  const { objectList, keySearch } = self.state;
  const { originalDataList } = objectList;


  self.setState({
    objectList: {
      ...objectList,
      data: originalDataList,
    },
    keySearch: {},
    modalSearch: false,
  });
};

export const onSearchGrid = (self, gridListName) => {
  const { object, keySearch } = self.state;
  const originalGridList = object[`original_${gridListName}`];

  if (!keySearch.packingUnitCode && !keySearch.productCode && !keySearch.productName && !keySearch.lotNo) {
    self.setState({
      object: {
        ...object,
        [gridListName]: originalGridList,
      },
      modalSearchGrid: false,
    });
    return;
  }

  let filteredProductList = [];

  if (originalGridList && originalGridList.length) {
    filteredProductList = originalGridList.filter((item) => {
      return (
        (!keySearch.packingUnitCode || item.packingUnitCode?.toLowerCase().includes(keySearch.packingUnitCode.toLowerCase())) &&
        (!keySearch.productCode || item.productCode?.toLowerCase().includes(keySearch.productCode.toLowerCase())) &&
        (!keySearch.productName || item.productName?.toLowerCase().includes(keySearch.productName.toLowerCase())) &&
        (!keySearch.lotNo || item.lotNo?.toLowerCase().includes(keySearch.lotNo.toLowerCase()))
      );
    });
  }

  self.setState({
    object: {
      ...object,
      [gridListName]: filteredProductList,
    },
    modalSearchGrid: false,
  });
};


export const onCloseScanModal = (self) => {
  const { object, isOkProductList } = self.state;

  const { tmpOutputTaskTabList } = object;

  tmpOutputTaskTabList.map(({ accorDionState, taskTab }) => {
    const gridListName = self[`${taskTab}_gridListName`];
    let gridList = [];

    if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && isOkProductList) {
      gridList = object.okProductList;
    } else if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
      gridList = object.ngProductList;
    } else {
      gridList = object[`${gridListName}`]
    }

    if (accorDionState) {
      let tempGridList = Array.from(gridList);
      const gridFieldList = self[`${taskTab}_tmpGridFieldList`];

      let tempFieldSet = {};

      for (const field of gridFieldList) {
        const { fieldName, type } = field;

        tempFieldSet = {
          ...tempFieldSet,
          ...getTempDefaultValue(taskTab, fieldName, type),
        }
      }

      Object.entries(tempFieldSet).forEach(([key, value]) => {
        object[key] = value;
      });

      self[`${taskTab}_tmpGridFieldList`] = cloneDeep(self[`${taskTab}_gridFieldList`]);

      self.setState({
        ...self.state,
        readOnlyPersisField: false,
        object: {
          ...object,
          [gridListName]: [
            ...tempGridList
          ],
          [`original_${gridListName}`]: [
            ...tempGridList
          ],
        },
        modalScan: false,
        errorScan: '',
      });
    } else {
      return;
    }
  })
}

export const onOpenScanModal = (self, taskTab) => {
  const { state } = self;
  const { object } = state;

  let modalScan = true;

  switch (taskTab) {
    case TASK_TAB_LIST.PICKING:
      modalScan = false;
      break;

    default:
      modalScan = true;
      break;
  }

  self.setState({
    ...state,
    object: {
      ...object,
      pickMaterialModalVisible: taskTab === TASK_TAB_LIST.PICKING ? true : false,
    },
    modalScan,
  });
}

export const onOpenScanOkProductListModal = (self) => {
  const { state } = self;
  const { object } = state;

  self.setState({
    ...state,
    object: {
      ...object,
    },
    modalScan: true,
    isOkProductList: true,
  });
}

export const onOpenScanNgProductListModal = (self) => {
  const { state } = self;
  const { object } = state;

  const gridFieldList = self[`inspection_tmpGridFieldList`];
  gridFieldList.push(
    {
      fieldName: 'newPackingUnit',
      type: DATA_TYPE.ID,
      hide: true,
      isNgProductField: true,
      persistOnScan: true,
    },
    {
      fieldName: 'newPackingUnit',
      mayBeRequired: true,
      type: DATA_TYPE.STRING,
      inputType: TYPE_FIELD_LIST.TEXT_INPUT,
      focusToField: 'uom',
      // readOnly: true,
      onChangePopupField: 'onProductChange',
      onSubmitField: 'onPackingUnitCodeSubmit',
      isNgProductField: true,
      persistOnScan: true,
    },
  )

  self.setState({
    ...state,
    object: {
      ...object,
    },
    modalScan: true,
    isOkProductList: false,
  });
}

export const onSetAccorDionProductListState = (self) => {
  const { state } = self;
  const { accordionProductListState } = state;
  if (accordionProductListState) {
    self.setState({
      ...state,
      accordionProductListState: false
    });
  } else {
    self.setState({
      ...state,
      accordionProductListState: true
    });
  }
}

export const onSetAccorDionDocumentListState = (self) => {
  const { state } = self;
  const { accordionDocumentListState } = state;
  if (accordionDocumentListState) {
    self.setState({
      ...state,
      accordionDocumentListState: false
    });
  } else {
    self.setState({
      ...state,
      accordionDocumentListState: true
    });
  }
}

export const onSetAccorDionScannedListState = (self) => {
  const { state } = self;
  const { accordionScannedListState } = state;
  if (accordionScannedListState) {
    self.setState({
      ...state,
      accordionScannedListState: false
    });
  } else {
    self.setState({
      ...state,
      accordionScannedListState: true
    });
  }
}

export const onSetAccordionState = (self, index) => {
  const { object } = self.state;
  const { tmpOutputTaskTabList } = object;

  const updatedTaskTabList = tmpOutputTaskTabList.map(outputTaskItem => {
    return {
      ...outputTaskItem,
      accorDionState: outputTaskItem.index === index ? !outputTaskItem.accorDionState : false,
    };
  });

  self.setState({
    object: {
      ...object,
      tmpOutputTaskTabList: updatedTaskTabList,
    },
    autoCreatePackingUnitCode: false,
  });
};

export const onSetPickInstructionListState = (self) => {
  const { pickInstructionListSearchModalState } = self.state;

  self.setState({
    ...self.state,
    pickInstructionListSearchModalState: !pickInstructionListSearchModalState,
  });
}

export const onAutoCreatePackingUnitCodeChange = async (self, data) => {
  let auto = self.state.autoCreatePackingUnitCode;
  self.setState({
    ...self.state,
    autoCreatePackingUnitCode: !auto,
  });
}

const validateCreatePU = async (receivingList, autoCreatePackingUnitCode) => {
  const errors = [];
  const groupedByPackingUnitNumber = groupBy(receivingList, 'packingUnitNumber');

  if (!receivingList) {
    errors.push({
      name: 'receivingList',
      message: 'msg.validate.isRequired',
    });

    return errors;
  }

  const packingUnitCodeList = [...new Set(receivingList.map(receiving => receiving.packingUnitCode))];
  const { error, data } = await apiGetList(
    'v1/packingUnits',
    {
      packingUnitCode: { $in: packingUnitCodeList }
    },
    {
      policyContext: 'packingUnitId',
    }
  );

  if (error) {
    errors.push(apiErrorMessages(error));
  }

  const packingUnitList = data.data;

  for (let i = 0; i < receivingList.length; i++) {
    const {
      packingUnitNumber, packingUnitCode, productId,
      packingUnitTypeId, qty
    } = receivingList[i];

    const isExisted = packingUnitList.find(f => f.packingUnitCode === packingUnitCode);

    if (isExisted) {
      errors.push({
        name: `[${i18n.t('receivingList')}].[${i + 1}].[${i18n.t('packingUnitCode')}] ${packingUnitCode}`,
        message: i18n.t('errorMessageDuplicateExists'),
      });
    }

    // if (!packingUnitNumber) {
    //   errors.push({
    //     name: `[${i18n.t('receivingList')}].[${i + 1}].[${i18n.t('packingUnitNumber')}]`,
    //     message: 'msg.validate.isRequired',
    //   });
    // }

    if (!autoCreatePackingUnitCode && !packingUnitCode) {
      errors.push({
        name: `[${i18n.t('receivingList')}].[${i + 1}].[${i18n.t('packingUnitCode')}]`,
        message: 'msg.validate.isRequired',
      });
    }

    if (!productId) {
      errors.push({
        name: `[${i18n.t('receivingList')}].[${i + 1}].[${i18n.t('productId')}]`,
        message: 'msg.validate.isRequired',
      });
    }

    if (!packingUnitTypeId) {
      errors.push({
        name: `[${i18n.t('receivingList')}].[${i + 1}].[${i18n.t('packingUnitTypeId')}]`,
        message: 'msg.validate.isRequired',
      });
    }

    if (!qty) {
      errors.push({
        name: `[${i18n.t('receivingList')}].[${i + 1}].[${i18n.t('qty')}]`,
        message: 'msg.validate.isRequired',
      });
    }
  }

  if (errors.length) {
    return errors;
  }

  forEach(groupedByPackingUnitNumber, (items, packingUnitNumber) => {
    const packingUnitCodes = map(items, 'packingUnitCode');

    if (uniq(packingUnitCodes).length > 1) {
      const packingUnitCodeErr = uniq(packingUnitCodes).join(', ');
      errors.push({
        name: 'receivingList',
        message: i18n.t('packingUnitCodeCreatePUError', { packingUnitNumber, packingUnitCodeErr }),
      });
    }

    const groupedByPackingUnitCode = groupBy(items, 'packingUnitCode');

    forEach(groupedByPackingUnitCode, (items, packingUnitCode) => {
      const productBatchCodes = map(items, (item) => `${item.productCode}-${item.lotNo}`);
      const duplicateProductBatchCodes = filter(productBatchCodes, (code, index, arr) => indexOf(arr, code) !== index);

      if (!isEmpty(duplicateProductBatchCodes)) {
        const duplicateProductErr = uniq(duplicateProductBatchCodes).join(', ');
        errors.push({
          name: 'receivingList',
          message: i18n.t('duplicateProductCreatePUError', { packingUnitNumber, packingUnitCode, duplicateProductErr }),
        });
      }
    });
  });

  return errors;
};

export const onFinish = async (self, buttonName) => {
  const { object, isOkProductList, autoCreatePackingUnitCode, refModels } = self.state;
  const { tmpOutputTaskTabList, productList } = object;
  const clientContext = getApiContextFromSelf(self, object.taskTypeName);

  if (autoCreatePackingUnitCode) {
    self.setState(LOADING_STATE);
    for (const { accorDionState, taskTab } of tmpOutputTaskTabList) {
      let gridListName = '';
      let gridList = [];

      if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && isOkProductList) {
        gridListName = 'okProductList'
        gridList = object.okProductList;
      } else if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
        gridListName = 'ngProductList'
        gridList = object.ngProductList;
      } else {
        gridListName = self[`${taskTab}_gridListName`];
        gridList = object[`${gridListName}`]
      }

      if (accorDionState) {
        let tempGridList = Array.from(gridList);
        const gridFieldList = self[`${taskTab}_tmpGridFieldList`];

        const isValid = gridFieldList && gridFieldList.every(({ fieldName, alt, isRequired, type }) => {
          if (isRequired && type === DATA_TYPE.ID) {
            let tempFieldName = `${taskTab}_${fieldName}Id`;

            if (!object[tempFieldName] || object[tempFieldName].trim() === '') {
              self.setState({
                ...self.state,
                errorScan: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
              });

              return false;
            }
          } else if (isRequired && type !== DATA_TYPE.ID) {
            let tempFieldName = `${taskTab}_${fieldName}`;

            if (!object[tempFieldName] || object[tempFieldName].toString().trim() === '') {
              self.setState({
                ...self.state,
                errorScan: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
              });

              return false;
            }
          }

          return true;
        });

        if (!isValid) {
          return;
        }

        //check product, lotno, qty hợp lệ
        const matchingProducts = productList.filter(p => isEqual(p.productCode, object[`${taskTab}_product`]));

        if (matchingProducts.length === 0) {
          self.setState({
            ...self.state,
            loading: false,
            errorScan: `${i18n.t('incorrectProductScanned')}`,
          });

          return;
        }

        // let isValidLotNo = false;
        // let isValidQty = false;

        // for (const productItem of matchingProducts) {
        //   const { lotNo, qty } = productItem;

        //   if (isEqual(lotNo, object[`${taskTab}_lotNo`])) {
        //     isValidLotNo = true;
        //   } else {
        //     isValidLotNo = false;
        //   }

        //   if (object[`${taskTab}_qty`] && object[`${taskTab}_qty`] <= qty) {
        //     isValidQty = true;
        //   } else {
        //     isValidQty = false;
        //   }

        //   if (isValidLotNo && isValidQty) {
        //     break;
        //   }
        // }

        // if (!isValidLotNo && !isValidQty) {
        //   self.setState({
        //     ...self.state,
        //     loading: false,
        //     errorScan: `${i18n.t('incorrectProductScanned')}`,
        //   });
        //   return;
        // }

        // if (!isValidLotNo) {
        //   self.setState({
        //     ...self.state,
        //     loading: false,
        //     errorScan: `${i18n.t('incorrectLotNoScanned')}`,
        //   });
        //   return;
        // }

        // if (!isValidQty) {
        //   self.setState({
        //     ...self.state,
        //     loading: false,
        //     errorScan: `${i18n.t('incorrectQtyScanned')}`,
        //   });
        //   return;
        // }

        let packingUnitItem = {};

        // tạo PU

        const {
          receivingList,

          companyId, companyCode, companyName,
          departmentId, departmentCode, departmentName,
          warehouseId, warehouseCode, warehouseName,

          customerId, customerCode, customerName,
          customerGroupId, customerGroupCode, customerGroupName,
          address, email,

          stagingLocatorId, stagingLocatorCode, stagingLocatorName,
          stagingLocatorTypeId, stagingLocatorTypeCode, stagingLocatorTypeName,
          stagingStoreSectionId, stagingStoreSectionCode, stagingStoreSectionName,
          stagingStoreId, stagingStoreCode, stagingStoreName,
          stagingStoreTypeId, stagingStoreTypeCode, stagingStoreTypeName,

          _id: taskId, taskCode, serviceOrderCode,
        } = object;

        const puObject = {
          taskId, taskCode, serviceOrderCode,

          companyId, companyCode, companyName,
          departmentId, departmentCode, departmentName,
          warehouseId, warehouseCode, warehouseName,

          customerId, customerCode, customerName,
          customerGroupId, customerGroupCode, customerGroupName,
          address, email,

          storeLocatorId: stagingLocatorId,
          storeLocatorCode: stagingLocatorCode,
          storeLocatorName: stagingLocatorName,

          storeLocatorTypeId: stagingLocatorTypeId,
          storeLocatorTypeCode: stagingLocatorTypeCode,
          storeLocatorTypeName: stagingLocatorTypeName,

          storeSectionId: stagingStoreSectionId,
          storeSectionCode: stagingStoreSectionCode,
          storeSectionName: stagingStoreSectionName,

          storeId: stagingStoreId,
          storeCode: stagingStoreCode,
          storeName: stagingStoreName,

          storeTypeId: stagingStoreTypeId,
          storeTypeCode: stagingStoreTypeCode,
          storeTypeName: stagingStoreTypeName,

          productAll: [],
        };

        const puProductList = [];

        const {
          productId, productCode, productName, productVolume,
          productSegmentId, productSegmentCode, productSegmentName,
          uomId, uomCode, uomName,
          lotNo, lotDate, expDate,
          qty,
        } = matchingProducts[0];

        puProductList.push({
          productId, productCode, productName, productVolume,
          productSegmentId, productSegmentCode, productSegmentName,
          uomId, uomCode, uomName,
          lotNo: lotNo ? lotNo : '', lotDate, expDate,
          packingUnitId: null,
          packingUnitCode: '',
          packingUnitName: '',
          qty,
        });

        let packingUnitCode = '';
        let packingUnitNumber = '';

        if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
          packingUnitCode = object[`${taskTab}_newPackingUnit`];
          packingUnitNumber = object[`${taskTab}_newPackingUnitNumber`];
        } else {
          packingUnitCode = object[`${taskTab}_packingUnit`];
          packingUnitNumber = object[`${taskTab}_packingUnitNumber`];
        }

        const packingUnitTypeId = object[`${taskTab}_packingUnitTypeId`];
        const packingUnitTypeCode = object[`${taskTab}_packingUnitTypeCode`];
        const packingUnitTypeName = object[`${taskTab}_packingUnitTypeName`];
        const oldPackingUnitId = object[`${taskTab}_oldPackingUnitId`];
        const oldPackingUnitCode = object[`${taskTab}_oldPackingUnitCode`];
        const oldPackingUnitName = object[`${taskTab}_oldPackingUnitName`];
        const puTypeWidth = object[`${taskTab}_puTypeWidth`];
        const puTypeDepth = object[`${taskTab}_puTypeDepth`];
        const puTypeHeight = object[`${taskTab}_puTypeHeight`];
        const puTypeMaxWeight = object[`${taskTab}_puTypeMaxWeight`];
        const puTypeVolume = object[`${taskTab}_puTypeVolume`];

        if (packingUnitCode && packingUnitCode.toString().trim() !== '') {
          const { error, data: packingUnitExists } = await apiGetList('v1/packingUnits', { packingUnitCode, deleted: false }, clientContext);

          if (error) {
            self.setState({
              loading: false,
              error: true,
              errorScan: apiErrorMessages(error),
            });

            return;
          }

          if (packingUnitExists.data.length) {
            self.setState({
              loading: false,
              error: true,
              errorScan: `${i18n.t('packingUnitCode')} ${i18n.t('existed')}`,
            });

            return;
          }
        }

        puObject.productAll = puProductList;
        puObject.packingUnitCode = packingUnitCode;
        puObject.packingUnitTypeId = packingUnitTypeId;
        puObject.packingUnitTypeCode = packingUnitTypeCode;
        puObject.packingUnitTypeName = packingUnitTypeName;
        puObject.newPackingUnitTypeId = packingUnitTypeId;
        puObject.newPackingUnitTypeCode = packingUnitTypeCode;
        puObject.newPackingUnitTypeName = packingUnitTypeName;
        puObject.puTypeWidth = puTypeWidth;
        puObject.puTypeDepth = puTypeDepth;
        puObject.puTypeHeight = puTypeHeight;
        puObject.puTypeMaxWeight = puTypeMaxWeight;
        puObject.puTypeVolume = puTypeVolume;
        puObject.packingUnitNumber = packingUnitNumber;

        // let relatedFields;

        // if (gridListName.toLowerCase() === TASK_TAB_LIST.PACKING.toLowerCase()) {
        //   relatedFields = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);

        // } else {
        //   relatedFields = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);

        // }

        await apiPost(`v1/storeLocators/updateProductList/${stagingLocatorId}`, { _id: stagingLocatorId, puProductList }, clientContext);
        const { error, data: newPackingUnit } = await apiCreate('v1/packingUnits', puObject, clientContext);
        if (error) {
          self.setState({
            loading: false,
            error: true,
            errorScan: apiErrorMessages(error),
          });

          return;
        }

        const newPackingUnitCreated = newPackingUnit.data;

        if (newPackingUnit && newPackingUnitCreated) {
          if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
            const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);

            if (relatedFields) {
              relatedFields.forEach((field) => {
                if (isObject(field)) {
                  const { fromField, toField } = field;

                  if (toField) {
                    object[`${taskTab}_${toField}`] = newPackingUnitCreated ? newPackingUnitCreated[fromField] : '';
                  }
                } else {
                  object[`${taskTab}_${field}`] = newPackingUnitCreated ? newPackingUnitCreated[field] : '';
                }
              });
            }
          } else {
            // const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);
            let relatedFields;

            if (gridListName.toLowerCase() === TASK_TAB_LIST.PACKING.toLowerCase()) {
              const result = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);
              if (result) {
                ({ relatedFields, query } = result);
              }
            } else {
              const result = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);
              if (result) {
                ({ relatedFields, query } = result);
              }
            }

            if (relatedFields) {
              relatedFields.forEach((field) => {
                if (isObject(field)) {
                  const { fromField, toField } = field;

                  if (toField) {
                    object[`${taskTab}_${toField}`] = newPackingUnitCreated ? newPackingUnitCreated[fromField] : '';
                  }
                } else {
                  object[`${taskTab}_${field}`] = newPackingUnitCreated ? newPackingUnitCreated[field] : '';
                }
              });
            }
          }
          // if (taskTab.toLowerCase() === TASK_TYPE_LIST.PACKING.toLowerCase()) {

          // }
        }

        if (taskTab.toLowerCase() === TASK_TAB_LIST.PACKING) {
          object[`${taskTab}_newPackingUnitId`] = newPackingUnitCreated._id;
          object[`${taskTab}_newPackingUnit`] = newPackingUnitCreated.packingUnitCode;
          object[`${taskTab}_newPackingUnitCode`] = newPackingUnitCreated.packingUnitCode;
          object[`${taskTab}_newPackingUnitName`] = newPackingUnitCreated.packingUnitName;
          object[`${taskTab}_newPackingUnitNumber`] = newPackingUnitCreated.packingUnitNumber;
          object[`${taskTab}_packingUnitTypeId`] = newPackingUnitCreated.packingUnitTypeId;
          object[`${taskTab}_packingUnitTypeCode`] = newPackingUnitCreated.packingUnitTypeCode;
          object[`${taskTab}_packingUnitTypeName`] = newPackingUnitCreated.packingUnitTypeName;
          object[`${taskTab}_oldPackingUnitId`] = oldPackingUnitId;
          object[`${taskTab}_oldPackingUnitCode`] = oldPackingUnitCode;
          object[`${taskTab}_oldPackingUnitName`] = oldPackingUnitName;
        }

        // const { _id, packingUnitCode: newPackingUnitCode, packingUnitName: newPackingUnitName } = newPackingUnit.data;
        // object[`${taskTab}_packingUnitId`] = _id;
        // object[`${taskTab}_packingUnitCode`] = newPackingUnitCode;
        // object[`${taskTab}_packingUnitName`] = newPackingUnitName;
        // object[`${taskTab}_newPackingUnitId`] = _id;
        // object[`${taskTab}_newPackingUnitCode`] = newPackingUnitCode;
        // object[`${taskTab}_newPackingUnitName`] = newPackingUnitName;
        // object[`${taskTab}_oldPackingUnitId`] = oldPackingUnitId;
        // object[`${taskTab}_oldPackingUnitCode`] = oldPackingUnitCode;
        // object[`${taskTab}_oldPackingUnitName`] = oldPackingUnitName;
        // object[`${taskTab}_newPackingUnitTypeId`] = packingUnitTypeId;
        // object[`${taskTab}_newPackingUnitTypeCode`] = packingUnitTypeCode;
        // object[`${taskTab}_newPackingUnitTypeName`] = packingUnitTypeName;

        //lấy lên các trường trong refModel vào list
        const tmpTaskTabItemList = Object.keys(object)
          .filter(key => key.startsWith(`${taskTab}_`))
          .reduce((acc, key) => {
            acc[key] = object[key];
            return acc;
          }, {});

        const newTmpTaskTabItemList = Object.keys(tmpTaskTabItemList).reduce((acc, key) => {
          const newKey = key.startsWith(`${taskTab}_`) ? key.slice(taskTab.length + 1) : key; // Bỏ tiền tố "receiving_"
          acc[newKey] = tmpTaskTabItemList[key];
          return acc;
        }, {});

        packingUnitItem = {
          ...newTmpTaskTabItemList,
          ...packingUnitItem,
        };

        // gridFieldList.map(({ fieldName, type }) => {
        //   if (type === DATA_TYPE.ID) {
        //     packingUnitItem[`${fieldName}Id`] = object[`${taskTab}_${fieldName}Id`];
        //     packingUnitItem[`${fieldName}Code`] = object[`${taskTab}_${fieldName}Code`];
        //     packingUnitItem[`${fieldName}Name`] = object[`${taskTab}_${fieldName}Name`];

        //   } else {
        //     packingUnitItem[fieldName] = object[`${taskTab}_${fieldName}`];
        //   }
        // })

        gridFieldList.map(({ fieldName, type, refModelName, persistOnScan }) => {
          if (type === DATA_TYPE.ID) {
            let relatedFields;
            if (TASK_TAB_LIST.PACKING.toLowerCase()) {
              const result = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);
              if (result) {
                ({ relatedFields } = result);
              }
            } else {
              const result = refModels.find((f) => f.fieldName === `${gridListName}.${refModelName || fieldName}Id`);
              if (result) {
                ({ relatedFields } = result);
              }
            }

            packingUnitItem[`${taskTab}_${fieldName}Id`] = object[`${taskTab}_${fieldName}Id`];

            if (relatedFields) {
              relatedFields.forEach((field) => {
                if (isObject(field)) {
                  const { fromField, toField } = field;

                  if (toField) {
                    packingUnitItem[`${toField}`] = _.isUndefined(object[`${taskTab}_${toField}`]) ? '' : object[`${taskTab}_${toField}`];
                  }
                } else {
                  packingUnitItem[`${field}`] = _.isUndefined(object[`${taskTab}_${field}`]) ? "" : object[`${taskTab}_${field}`];
                }
              });
            }

          } else {
            packingUnitItem[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
          }
        })

        if (Object.keys(packingUnitItem).length !== 0) {
          tempGridList.push(packingUnitItem);
        }

        let tempFieldSet = {};

        for (const field of gridFieldList) {
          const { fieldName, type } = field;

          tempFieldSet = {
            ...tempFieldSet,
            ...getTempDefaultValue(taskTab, fieldName, type),
          }
        }

        //xóa các trường có dạng receiving_...
        Object.keys(object).forEach(key => {
          if (key.startsWith(`${taskTab}_`)) {
            delete object[key];
          }
        });

        //thêm lại các trường receiving_... đã set giá trị ban đầu
        Object.entries(tempFieldSet).forEach(([key, value]) => {
          object[key] = value;
        });

        if (buttonName === 'finish') {
          self.setState({
            ...self.state,
            loading: false,
            object: {
              ...object,
              [gridListName]: [
                ...tempGridList
              ],
              [`original_${gridListName}`]: [
                ...tempGridList
              ],
            },
            modalScan: false,
            errorScan: '',
          });
        }

        if (!(taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList)) {
          self[`${taskTab}_tmpGridFieldList`] = cloneDeep(self[`${taskTab}_gridFieldList`]);
        }

        if (buttonName === 'scanNewPackage') {
          self.setState({
            ...self.state,
            loading: false,
            object: {
              ...object,
              [gridListName]: [
                ...tempGridList
              ],
              [`original_${gridListName}`]: [
                ...tempGridList
              ],
            },
            // modalScan: false,
            errorScan: '',
          });
        }

      } else {
        return;
      }
    }

  } else {
    tmpOutputTaskTabList.map(({ accorDionState, taskTab }) => {
      let gridListName = '';
      let gridList = [];

      if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && isOkProductList) {
        gridListName = 'okProductList'
        gridList = object.okProductList;
      } else if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
        gridListName = 'ngProductList'
        gridList = object.ngProductList;
      } else {
        gridListName = self[`${taskTab}_gridListName`];
        gridList = object[`${gridListName}`]
      }

      if (accorDionState) {
        let tempGridList = Array.from(gridList);
        const gridFieldList = self[`${taskTab}_tmpGridFieldList`];

        const isValid = gridFieldList && gridFieldList.every(({ fieldName, alt, isRequired, type }) => {
          if (isRequired && type === DATA_TYPE.ID) {
            let tempFieldName = `${taskTab}_${fieldName}Id`;

            if (!object[tempFieldName] || object[tempFieldName].trim() === '') {
              self.setState({
                ...self.state,
                errorScan: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
              });

              return false;
            }
          } else if (isRequired && type !== DATA_TYPE.ID) {
            let tempFieldName = `${taskTab}_${fieldName}`;

            if (!object[tempFieldName] || object[tempFieldName].toString().trim() === '') {
              self.setState({
                ...self.state,
                errorScan: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
              });

              return false;
            }
          }

          return true;
        });

        if (!isValid) {
          return;
        }

        //check product, lotno, qty hợp lệ
        const matchingProducts = productList.filter(p => isEqual(p.productCode, object[`${taskTab}_product`]));

        if (matchingProducts.length === 0) {
          self.setState({
            ...self.state,
            loading: false,
            errorScan: `${i18n.t('incorrectProductScanned')}`,
          });

          return;
        }

        // let isValidLotNo = false;
        // let isValidQty = false;

        // for (const productItem of matchingProducts) {
        //   const { lotNo, qty } = productItem;

        //   if (isEqual(lotNo, object[`${taskTab}_lotNo`])) {
        //     isValidLotNo = true;
        //   } else {
        //     isValidLotNo = false;
        //   }

        //   if (object[`${taskTab}_qty`] && object[`${taskTab}_qty`] <= qty) {
        //     isValidQty = true;
        //   } else {
        //     isValidQty = false;
        //   }

        //   if (isValidLotNo && isValidQty) {
        //     break;
        //   }
        // }

        // if (!isValidLotNo && !isValidQty) {
        //   self.setState({
        //     ...self.state,
        //     loading: false,
        //     errorScan: `${i18n.t('incorrectProductScanned')}`,
        //   });
        //   return;
        // }

        // if (!isValidLotNo) {
        //   self.setState({
        //     ...self.state,
        //     loading: false,
        //     errorScan: `${i18n.t('incorrectLotNoScanned')}`,
        //   });
        //   return;
        // }

        // if (!isValidQty) {
        //   self.setState({
        //     ...self.state,
        //     loading: false,
        //     errorScan: `${i18n.t('incorrectQtyScanned')}`,
        //   });
        //   return;
        // }

        let packingUnitItem = {};

        //lấy lên các trường trong refModel vào list
        const tmpTaskTabItemList = Object.keys(object)
          .filter(key => key.startsWith(`${taskTab}_`))
          .reduce((acc, key) => {
            acc[key] = object[key];
            return acc;
          }, {});

        const newTmpTaskTabItemList = Object.keys(tmpTaskTabItemList).reduce((acc, key) => {
          const newKey = key.startsWith(`${taskTab}_`) ? key.slice(taskTab.length + 1) : key; // Bỏ tiền tố "receiving_"
          acc[newKey] = tmpTaskTabItemList[key];
          return acc;
        }, {});

        packingUnitItem = {
          ...newTmpTaskTabItemList,
          ...packingUnitItem,
        };

        // gridFieldList.map(({ fieldName, type }) => {
        //   if (type === DATA_TYPE.ID) {
        //     packingUnitItem[`${fieldName}Id`] = object[`${taskTab}_${fieldName}Id`];
        //     packingUnitItem[`${fieldName}Code`] = object[`${taskTab}_${fieldName}Code`];
        //     packingUnitItem[`${fieldName}Name`] = object[`${taskTab}_${fieldName}Name`];

        //   } else {
        //     packingUnitItem[fieldName] = object[`${taskTab}_${fieldName}`];
        //   }
        // })

        gridFieldList.map(({ fieldName, type, refModelName, persistOnScan }) => {
          if (type === DATA_TYPE.ID) {
            // const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.${refModelName || fieldName}Id`);

            let relatedFields;
            if (TASK_TAB_LIST.PACKING.toLowerCase()) {
              const result = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);
              if (result) {
                ({ relatedFields } = result);
              }
            } else {
              const result = refModels.find((f) => f.fieldName === `${gridListName}.${refModelName || fieldName}Id`);
              if (result) {
                ({ relatedFields } = result);
              }
            }

            packingUnitItem[`${taskTab}_${fieldName}Id`] = object[`${taskTab}_${fieldName}Id`];

            if (relatedFields) {
              relatedFields.forEach((field) => {
                if (isObject(field)) {
                  const { fromField, toField } = field;

                  if (toField) {
                    packingUnitItem[`${toField}`] = _.isUndefined(object[`${taskTab}_${toField}`]) ? '' : object[`${taskTab}_${toField}`];
                  }
                } else {
                  packingUnitItem[`${field}`] = _.isUndefined(object[`${taskTab}_${field}`]) ? "" : object[`${taskTab}_${field}`];
                }
              });
            }

          } else {
            packingUnitItem[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
          }
        })

        if (Object.keys(packingUnitItem).length !== 0) {
          tempGridList.push(packingUnitItem);
        }
        // }

        let tempFieldSet = {};

        for (const field of gridFieldList) {
          const { fieldName, type } = field;

          tempFieldSet = {
            ...tempFieldSet,
            ...getTempDefaultValue(taskTab, fieldName, type),
          }
        }

        Object.entries(tempFieldSet).forEach(([key, value]) => {
          object[key] = value;
        });


        if (buttonName === 'finish') {
          self[`${taskTab}_tmpGridFieldList`] = cloneDeep(self[`${taskTab}_gridFieldList`]);

          self.setState({
            ...self.state,
            loading: false,
            object: {
              ...object,
              [gridListName]: [
                ...tempGridList
              ],
              [`original_${gridListName}`]: [
                ...tempGridList
              ],
            },
            modalScan: false,
            errorScan: '',
          });
        }

        if (buttonName === 'scanNewPackage') {
          if (!(taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList)) {
            self[`${taskTab}_tmpGridFieldList`] = cloneDeep(self[`${taskTab}_gridFieldList`]);
          }

          self.setState({
            ...self.state,
            loading: false,
            object: {
              ...object,
              [gridListName]: [
                ...tempGridList
              ],
              [`original_${gridListName}`]: [
                ...tempGridList
              ],
            },
            // modalScan: false,
            errorScan: '',
          });
        }
      } else {
        return;
      }
    })
  }
}

export const onScanSamePackageChange = async (self) => {
  try {
    const { object, isOkProductList, autoCreatePackingUnitCode, refModels } = self.state;
    const { tmpOutputTaskTabList, productList } = object;
    const clientContext = getApiContextFromSelf(self, object.taskTypeName);

    if (autoCreatePackingUnitCode) {
      self.setState(LOADING_STATE);
      for (const { accorDionState, taskTab } of tmpOutputTaskTabList) {
        let gridListName = '';
        let gridList = [];

        if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && isOkProductList) {
          gridListName = 'okProductList'
          gridList = object.okProductList;
        } else if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
          gridListName = 'ngProductList'
          gridList = object.ngProductList;
        } else {
          gridListName = self[`${taskTab}_gridListName`];
          gridList = object[`${gridListName}`]
        }

        let relatedFields;
        let query;

        // Bảo sửa
        if (gridListName.toLowerCase() === TASK_TAB_LIST.PACKING.toLowerCase()) {
          const result = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);
          if (result) {
            ({ relatedFields, query } = result);
          }
        } else {
          const result = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);
          if (result) {
            ({ relatedFields, query } = result);
          }
        }
        // Bảo sửa

        if (accorDionState) {
          let tempGridList = Array.from(gridList);
          const gridFieldList = self[`${taskTab}_tmpGridFieldList`];

          const isValid = gridFieldList && gridFieldList.every(({ fieldName, alt, isRequired, type }) => {
            if (isRequired && type === DATA_TYPE.ID) {
              let tempFieldName = `${taskTab}_${fieldName}Id`;

              if (!object[tempFieldName] || object[tempFieldName].trim() === '') {
                self.setState({
                  ...self.state,
                  loading: false,
                  errorScan: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
                });

                return false;
              }
            } else if (isRequired && type !== DATA_TYPE.ID) {
              let tempFieldName = `${taskTab}_${fieldName}`;

              if (!object[tempFieldName] || object[tempFieldName].toString().trim() === '') {
                self.setState({
                  ...self.state,
                  loading: false,
                  errorScan: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
                });

                return false;
              }
            }

            return true;
          });

          if (!isValid) {
            return;
          }

          //check product, lotno, qty hợp lệ
          const matchingProducts = productList.filter(p => isEqual(p.productCode, object[`${taskTab}_product`]) && isEqual(p.lotNo, object[`${taskTab}_lotNo`]));

          if (matchingProducts.length === 0) {
            self.setState({
              ...self.state,
              loading: false,
              errorScan: `${i18n.t('incorrectProductScanned')}`,
            });

            return;
          }

          let isValidLotNo = false;
          let isValidQty = false;
          let productSelected = matchingProducts[0];

          // for (const productItem of matchingProducts) {
          //   const { lotNo, qty } = productItem;

          //   if (isEqual(lotNo, object[`${taskTab}_lotNo`])) {
          //     isValidLotNo = true;
          //   } else {
          //     isValidLotNo = false;
          //   }

          // if (object[`${taskTab}_qty`] && object[`${taskTab}_qty`] <= qty) {
          //   isValidQty = true;
          // } else {
          //   isValidQty = false;
          // }

          // if (isValidLotNo && isValidQty) {
          //   productSelected = productItem;
          //   break;
          // }
          // if (isValidLotNo) {
          //   productSelected = productItem;
          //   break;
          // }
          // }

          // if (!isValidLotNo && !isValidQty) {
          //   self.setState({
          //     ...self.state,
          //     loading: false,
          //     errorScan: `${i18n.t('incorrectProductScanned')}`,
          //   });
          //   return;
          // }

          // if (!isValidLotNo) {
          //   self.setState({
          //     ...self.state,
          //     loading: false,
          //     errorScan: `${i18n.t('incorrectLotNoScanned')}`,
          //   });
          //   return;
          // }

          // if (!isValidQty) {
          //   self.setState({
          //     ...self.state,
          //     loading: false,
          //     errorScan: `${i18n.t('incorrectQtyScanned')}`,
          //   });
          //   return;
          // }

          // tạo PU

          const {
            receivingList,

            companyId, companyCode, companyName,
            departmentId, departmentCode, departmentName,
            warehouseId, warehouseCode, warehouseName,

            customerId, customerCode, customerName,
            customerGroupId, customerGroupCode, customerGroupName,
            address, email,

            stagingLocatorId, stagingLocatorCode, stagingLocatorName,
            stagingLocatorTypeId, stagingLocatorTypeCode, stagingLocatorTypeName,
            stagingStoreSectionId, stagingStoreSectionCode, stagingStoreSectionName,
            stagingStoreId, stagingStoreCode, stagingStoreName,
            stagingStoreTypeId, stagingStoreTypeCode, stagingStoreTypeName,

            _id: taskId, taskCode, serviceOrderCode,
          } = object;

          const puObject = {
            taskId, taskCode, serviceOrderCode,

            companyId, companyCode, companyName,
            departmentId, departmentCode, departmentName,
            warehouseId, warehouseCode, warehouseName,

            customerId, customerCode, customerName,
            customerGroupId, customerGroupCode, customerGroupName,
            address, email,

            storeLocatorId: stagingLocatorId,
            storeLocatorCode: stagingLocatorCode,
            storeLocatorName: stagingLocatorName,

            storeLocatorTypeId: stagingLocatorTypeId,
            storeLocatorTypeCode: stagingLocatorTypeCode,
            storeLocatorTypeName: stagingLocatorTypeName,

            storeSectionId: stagingStoreSectionId,
            storeSectionCode: stagingStoreSectionCode,
            storeSectionName: stagingStoreSectionName,

            storeId: stagingStoreId,
            storeCode: stagingStoreCode,
            storeName: stagingStoreName,

            storeTypeId: stagingStoreTypeId,
            storeTypeCode: stagingStoreTypeCode,
            storeTypeName: stagingStoreTypeName,

            productAll: [],
          };

          const puProductList = [];

          const {
            productId, productCode, productName, productVolume,
            productSegmentId, productSegmentCode, productSegmentName,
            refDocumentTypeList = [], productAttributeList = [],
            uomId, uomCode, uomName,
            lotNo, lotDate, expDate,
            qty,
          } = productSelected;

          let packingUnitCode = '';
          let packingUnitNumber = '';
          let packingUnitId = null;

          if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
            packingUnitId = object[`${taskTab}_newPackingUnitId`];
            packingUnitCode = object[`${taskTab}_newPackingUnit`];
            packingUnitNumber = object[`${taskTab}_newPackingUnitNumber`];
          } else {
            packingUnitId = object[`${taskTab}_newPackingUnitId`];
            packingUnitCode = object[`${taskTab}newPackingUnitCode`];
            packingUnitNumber = object[`${taskTab}_packingUnitNumber`];
          }

          // if (taskTab.toLowerCase() === TASK_TYPE_LIST.PACKING.toLowerCase()) {
          //   packingUnitId = object[`${taskTab}_newPackingUnitId`];
          //   packingUnitCode = object[`${taskTab}_newPackingUnitCode`];
          //   packingUnitNumber = object[`${taskTab}_newPackingUnitNumber`];
          //   console.log("**************************:", packingUnitCode)
          // }
          // const packingUnitId = object[`${taskTab}_packingUnitId`];
          // const packingUnitCode = object[`${taskTab}_packingUnit`];
          // const prePackingUnitCode = object[`${taskTab}_packingUnitCode`];
          const packingUnitTypeId = object[`${taskTab}_packingUnitTypeId`];
          const packingUnitTypeCode = object[`${taskTab}_packingUnitTypeCode`];
          const packingUnitTypeName = object[`${taskTab}_packingUnitTypeName`];
          const puTypeWidth = object[`${taskTab}_puTypeWidth`];
          const puTypeDepth = object[`${taskTab}_puTypeDepth`];
          const puTypeHeight = object[`${taskTab}_puTypeHeight`];
          const puTypeMaxWeight = object[`${taskTab}_puTypeMaxWeight`];
          const puTypeVolume = object[`${taskTab}_puTypeVolume`];
          // const packingUnitNumber = object[`${taskTab}_packingUnitNumber`];



          // if (taskTab.toLowerCase() !== TASK_TAB_LIST.PACKING) {
          //   if (packingUnitCode != prePackingUnitCode) {
          //     self.setState({
          //       loading: false,
          //       error: true,
          //       errorScan: `ko dc thay doi kien hang`,
          //     });

          //     return;
          //   }
          // }

          let newPackingUnitData = {};

          if (packingUnitId && isObjectId(packingUnitId)) { //tiếp cùng kiện lần 2 trở đi

            const newQuery = {
              ...query,
              _id: packingUnitId,
            }
            const { error, data: packingUnitExists } = await apiGetList('v1/packingUnits', { _id: packingUnitId, deleted: false }, clientContext);

            if (error) {
              self.setState({
                loading: false,
                error: true,
                errorScan: apiErrorMessages(error),
              });

              return;
            }
            newPackingUnitData = packingUnitExists.data[0];
            // console.log("🚀 ~ onScanSamePackageChange ~ newPackingUnitData:", JSON.stringify(newPackingUnitData, null, 2))
            const { productAll } = newPackingUnitData;

            // for (const productItem of productAll) {
            //   if (productCode == productItem.productCode && lotNo == productItem.lotNo) {
            //     self.setState({
            //       loading: false,
            //       error: true,
            //       // errorScan: `${i18n.t('productWithLotNoAlreadyExists')}`,
            //       errorScan: i18n.t('productWithLotNoAlreadyExists', { productCode, lotNo }),
            //     });

            //     return;
            //   }

            // }
            productAll.push({
              productId, productCode, productName, productVolume,
              productSegmentId, productSegmentCode, productSegmentName,
              refDocumentTypeList, productAttributeList,
              uomId, uomCode, uomName,
              lotNo, lotDate, expDate,
              qty,
            })
            // console.log("🚀 ~ onScanSamePackageChange ~ productAll:", JSON.stringify(productAll, null, 2))

            // const { error: errorUpdate, data: packingUnitUpdated } = await apiUpdate('v1/packingUnits', newPackingUnitData._id, newPackingUnitData, clientContext);
            await apiPost(`v1/packingUnits/updateProdutLine/${newPackingUnitData._id}`, newPackingUnitData);

            // const { _id, packingUnitCode: newPackingUnitCode, packingUnitName: newPackingUnitName } = newPackingUnitData;
            // object[`${taskTab}_packingUnitId`] = _id;
            // object[`${taskTab}_packingUnitCode`] = newPackingUnitCode;
            // object[`${taskTab}_packingUnitName`] = newPackingUnitName;
            if (newPackingUnitData) {
              // console.log("🚀 ~ !!!!!onScanSamePackageChange ~ newPackingUnitData:", JSON.stringify(newPackingUnitData, null, 2))
              if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {

                const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);

                if (relatedFields) {
                  relatedFields.forEach((field) => {
                    if (isObject(field)) {
                      const { fromField, toField } = field;

                      if (toField) {
                        object[`${taskTab}_${toField}`] = newPackingUnitData ? newPackingUnitData[fromField] : '';
                      }
                    } else {
                      object[`${taskTab}_${field}`] = newPackingUnitData ? newPackingUnitData[field] : '';
                    }
                  });
                }
              } else {
                // const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);
                let relatedFields

                if (gridListName.toLowerCase() === TASK_TAB_LIST.PACKING.toLowerCase()) {
                  const result = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);
                  if (result) {
                    ({ relatedFields, query } = result);
                  }
                } else {
                  const result = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);
                  if (result) {
                    ({ relatedFields, query } = result);
                  }
                }
                if (relatedFields) {
                  relatedFields.forEach((field) => {
                    if (isObject(field)) {
                      const { fromField, toField } = field;

                      if (toField) {
                        object[`${taskTab}_${toField}`] = newPackingUnitData ? newPackingUnitData[fromField] : '';
                      }
                    } else {
                      object[`${taskTab}_${field}`] = newPackingUnitData ? newPackingUnitData[field] : '';
                    }
                  });
                }
              }
            }
          } else { // tiếp cùng kiện lần 1
            if (packingUnitCode && packingUnitCode.toString().trim() !== '') {
              const newQuery = {
                ...query,
                packingUnitCode,
              }

              const { error, data: packingUnitExists } = await apiGetList('v1/packingUnits', { packingUnitCode, deleted: false }, clientContext);

              if (error) {
                self.setState({
                  loading: false,
                  error: true,
                  errorScan: apiErrorMessages(error),
                });

                return;
              }

              if (packingUnitExists.data.length) {
                self.setState({
                  loading: false,
                  error: true,
                  errorScan: `${i18n.t('packingUnitCode')} ${i18n.t('existed')}`,
                });

                return;
              }
            }

            puProductList.push({
              productId, productCode, productName, productVolume,
              productSegmentId, productSegmentCode, productSegmentName,
              uomId, uomCode, uomName,
              lotNo, lotDate, expDate,
              qty,
            });

            puObject.productAll = puProductList;
            puObject.packingUnitCode = packingUnitCode;
            puObject.packingUnitTypeId = packingUnitTypeId;
            puObject.packingUnitTypeCode = packingUnitTypeCode;
            puObject.packingUnitTypeName = packingUnitTypeName;
            puObject.newPackingUnitTypeId = packingUnitTypeId;
            puObject.newPackingUnitTypeCode = packingUnitTypeCode;
            puObject.newPackingUnitTypeName = packingUnitTypeName;
            puObject.puTypeWidth = puTypeWidth;
            puObject.puTypeDepth = puTypeDepth;
            puObject.puTypeHeight = puTypeHeight;
            puObject.puTypeMaxWeight = puTypeMaxWeight;
            puObject.puTypeVolume = puTypeVolume;
            puObject.packingUnitNumber = packingUnitNumber;

            await apiPost(`v1/storeLocators/updateProductList/${stagingLocatorId}`, { _id: stagingLocatorId, puProductList }, clientContext);
            const { error, data: newPackingUnit } = await apiCreate('v1/packingUnits', puObject, clientContext);
            if (error) {
              self.setState({
                loading: false,
                error: true,
                errorScan: apiErrorMessages(error),
              });

              return;
            }

            newPackingUnitData = newPackingUnit.data;
            // const { _id, packingUnitCode: newPackingUnitCode, packingUnitName: newPackingUnitName } = newPackingUnitData;

            // object[`${taskTab}_packingUnitId`] = _id;
            // object[`${taskTab}_packingUnitCode`] = newPackingUnitCode;
            // object[`${taskTab}_packingUnitName`] = newPackingUnitName;
            // object[`${taskTab}_newPackingUnitId`] = _id;
            // object[`${taskTab}_newPackingUnitCode`] = newPackingUnitCode;
            // object[`${taskTab}_newPackingUnitName`] = newPackingUnitName;
            // object[`${taskTab}_oldPackingUnitId`] = _id;
            // object[`${taskTab}_oldPackingUnitCode`] = newPackingUnitCode;
            // object[`${taskTab}_oldPackingUnitName`] = newPackingUnitName;

            // const newPackingUnitCreated = newPackingUnit.data;

            if (newPackingUnit && newPackingUnitData) {
              if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {

                const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);
                object[`${taskTab}_newPackingUnitId`] = newPackingUnitData._id;
                object[`${taskTab}_newPackingUnit`] = newPackingUnitData.packingUnitCode;

                if (relatedFields) {
                  relatedFields.forEach((field) => {
                    if (isObject(field)) {
                      const { fromField, toField } = field;

                      if (toField) {
                        object[`${taskTab}_${toField}`] = newPackingUnitData ? newPackingUnitData[fromField] : '';
                      }
                    } else {
                      object[`${taskTab}_${field}`] = newPackingUnitData ? newPackingUnitData[field] : '';
                    }
                  });
                }
              } else {
                // const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);
                let relatedFields;
                console.log(gridListName);

                if (TASK_TAB_LIST.PACKING.toLowerCase()) {
                  const result = refModels.find((f) => f.fieldName === `newPackingUnitId`);
                  if (result) {
                    ({ relatedFields } = result);
                  }
                } else {
                  const result = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);
                  if (result) {
                    ({ relatedFields } = result);
                  }
                }

                object[`${taskTab}_packingUnitId`] = newPackingUnitData._id;
                object[`${taskTab}_packingUnit`] = newPackingUnitData.packingUnitCode;

                if (relatedFields) {
                  relatedFields.forEach((field) => {
                    if (isObject(field)) {
                      const { fromField, toField } = field;

                      if (toField) {
                        object[`${taskTab}_${toField}`] = newPackingUnitData ? newPackingUnitData[fromField] : '';
                      }
                    } else {
                      object[`${taskTab}_${field}`] = newPackingUnitData ? newPackingUnitData[field] : '';
                    }
                  });
                }
              }
              // const { _id, packingUnitCode: newPackingUnitCode, packingUnitName: newPackingUnitName } = newPackingUnitData;

              // object[`${taskTab}_packingUnitId`] = _id;
              // object[`${taskTab}_packingUnitCode`] = newPackingUnitCode;
              // object[`${taskTab}_packingUnitName`] = newPackingUnitName;



              if (taskTab.toLowerCase() === TASK_TAB_LIST.PACKING) {
                object[`${taskTab}_newPackingUnitId`] = newPackingUnitData._id;
                object[`${taskTab}_newPackingUnit`] = newPackingUnitData.packingUnitCode;
                object[`${taskTab}_newPackingUnitCode`] = newPackingUnitData.packingUnitCode;
                object[`${taskTab}_newPackingUnitName`] = newPackingUnitData.packingUnitName;
                object[`${taskTab}_newPackingUnitNumber`] = newPackingUnitData.packingUnitNumber;
                object[`${taskTab}_packingUnitTypeId`] = newPackingUnitData.packingUnitTypeId;
                object[`${taskTab}_packingUnitTypeCode`] = newPackingUnitData.packingUnitTypeCode;
                object[`${taskTab}_packingUnitTypeName`] = newPackingUnitData.packingUnitTypeName;
                // object[`${taskTab}_oldPackingUnitId`] = _id;
                // object[`${taskTab}_oldPackingUnitCode`] = oldPackingUnitCode;
                // object[`${taskTab}_oldPackingUnitName`] = oldPackingUnitName;
              }
            }
          }

          let packingUnitItem = {};
          let tempFieldSet = {};

          //lấy lên các trường trong refModel vào list
          const tmpTaskTabItemList = Object.keys(object)
            .filter(key => key.startsWith(`${taskTab}_`))
            .reduce((acc, key) => {
              acc[key] = object[key];
              return acc;
            }, {});

          const newTmpTaskTabItemList = Object.keys(tmpTaskTabItemList).reduce((acc, key) => {
            const newKey = key.startsWith(`${taskTab}_`) ? key.slice(taskTab.length + 1) : key; // Bỏ tiền tố "receiving_"
            acc[newKey] = tmpTaskTabItemList[key];
            return acc;
          }, {});

          packingUnitItem = {
            ...newTmpTaskTabItemList,
            ...packingUnitItem,
          };

          gridFieldList.map(({ fieldName, type, refModelName, persistOnScan }) => {
            if (type === DATA_TYPE.ID) {
              // const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.${refModelName || fieldName}Id`);
              let relatedFields;
              if (TASK_TAB_LIST.PACKING.toLowerCase()) {
                const result = refModels.find((f) => f.fieldName === `${gridListName}.newPackingUnitId`);
                if (result) {
                  ({ relatedFields } = result);
                }
              } else {
                const result = refModels.find((f) => f.fieldName === `${gridListName}.${refModelName || fieldName}Id`);
                if (result) {
                  ({ relatedFields } = result);
                }
              }
              packingUnitItem[`${taskTab}_${fieldName}Id`] = object[`${taskTab}_${fieldName}Id`];

              if (relatedFields) {
                relatedFields.forEach((field) => {
                  if (isObject(field)) {
                    const { fromField, toField } = field;

                    if (toField) {
                      packingUnitItem[`${toField}`] = _.isUndefined(object[`${taskTab}_${toField}`]) ? '' : object[`${taskTab}_${toField}`];
                    }
                  } else {
                    packingUnitItem[`${field}`] = _.isUndefined(object[`${taskTab}_${field}`]) ? "" : object[`${taskTab}_${field}`];
                  }
                });
              }

              if (relatedFields && persistOnScan) {
                tempFieldSet[`${taskTab}_${fieldName}Id`] = object[`${taskTab}_${fieldName}Id`];

                relatedFields.forEach((field) => {
                  if (isObject(field)) {
                    const { fromField, toField } = field;

                    if (toField) {
                      tempFieldSet[`${taskTab}_${toField}`] = _.isUndefined(object[`${taskTab}_${toField}`]) ? '' : object[`${taskTab}_${toField}`];
                    }
                  } else {
                    // console.log(field, "-------:", _.isUndefined(object[`${taskTab}_${field}`]) ? '' : object[`${taskTab}_${field}`])
                    tempFieldSet[`${taskTab}_${field}`] = _.isUndefined(object[`${taskTab}_${field}`]) ? '' : object[`${taskTab}_${field}`];
                  }
                });
              }

              if (relatedFields && !persistOnScan) {
                tempFieldSet[`${taskTab}_${fieldName}Id`] = null;

                relatedFields.forEach((field) => {
                  if (isObject(field)) {
                    const { fromField, toField } = field;

                    if (toField) {
                      tempFieldSet[`${taskTab}_${toField}`] = '';
                    }
                  } else {
                    tempFieldSet[`${taskTab}_${field}`] = '';
                  }
                });
              }

            } else if (type === DATA_TYPE.STRING) {

              packingUnitItem[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
              if (persistOnScan) {
                tempFieldSet[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
              } else {
                tempFieldSet[`${taskTab}_${fieldName}`] = '';
              }
            } else if (type === DATA_TYPE.DATE || type === DATA_TYPE.DATE_TIME) {
              packingUnitItem[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
              if (persistOnScan) {
                tempFieldSet[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
              } else {
                tempFieldSet[`${taskTab}_${fieldName}`] = null;
              }
            }
          })

          if (Object.keys(packingUnitItem).length !== 0) {
            tempGridList.push(packingUnitItem);
          }

          for (const field of gridFieldList) {
            const { fieldName, type, persistOnScan } = field;

            if (!persistOnScan) {
              tempFieldSet = {
                ...tempFieldSet,
                ...getTempDefaultValue(taskTab, fieldName, type),
              }
            }
          }

          // xóa các trường có dạng receiving_...
          Object.keys(object).forEach(key => {
            if (key.startsWith(`${taskTab}_`)) {
              delete object[key];
            }
          });

          //thêm lại các trường receiving_... đã set giá trị ban đầu
          Object.entries(tempFieldSet).forEach(([key, value]) => {
            object[key] = value;
          });

          //thêm các trường packingUnit đã tạo
          if (relatedFields) {
            relatedFields.forEach((field) => {
              if (isObject(field)) {
                const { fromField, toField } = field;

                if (toField) {
                  object[`${taskTab}_${toField}`] = Object.keys(newPackingUnitData).length > 0 ? newPackingUnitData[fromField] : '';
                }
              } else {
                object[`${taskTab}_${field}`] = Object.keys(newPackingUnitData).length > 0 ? newPackingUnitData[field] : '';
              }
            });
          }

          // object[`${taskTab}_packingUnitId`] = newPackingUnitData._id;
          // object[`${taskTab}_packingUnit`] = newPackingUnitData[`packingUnitCode`];

          if (!(taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList)) {
            self[`${taskTab}_tmpGridFieldList`] = cloneDeep(self[`${taskTab}_gridFieldList`]);
          }

          self.setState({
            ...self.state,
            loading: false,
            readOnlyPersisField: true,
            object: {
              ...object,
              [gridListName]: [
                ...tempGridList
              ],
              [`original_${gridListName}`]: [
                ...tempGridList
              ],
            },
            // modalScan: false,
            errorScan: '',
          });

        } else {
          return;
        }
      }

    } else {
      const { object, isOkProductList } = self.state;

      const { tmpOutputTaskTabList, productList } = object;

      tmpOutputTaskTabList.map(({ accorDionState, taskTab }) => {
        let gridListName = '';
        let gridList = [];

        if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && isOkProductList) {
          gridListName = 'okProductList'
          gridList = object.okProductList;
        } else if (taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList) {
          gridListName = 'ngProductList'
          gridList = object.ngProductList;
        } else {
          gridListName = self[`${taskTab}_gridListName`];
          gridList = object[`${gridListName}`]
        }

        const { relatedFields, query } = refModels.find((f) => f.fieldName === `${gridListName}.packingUnitId`);

        if (accorDionState) {
          let tempGridList = Array.from(gridList);
          const gridFieldList = self[`${taskTab}_tmpGridFieldList`];

          const isValid = gridFieldList && gridFieldList.every(({ fieldName, alt, isRequired, type }) => {
            if (isRequired && type === DATA_TYPE.ID) {
              let tempFieldName = `${taskTab}_${fieldName}Id`;

              if (!object[tempFieldName] || object[tempFieldName].trim() === '') {

                self.setState({
                  ...self.state,
                  errorScan: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
                });

                return false;
              }
            } else if (isRequired && type !== DATA_TYPE.ID) {
              let tempFieldName = `${taskTab}_${fieldName}`;

              if (!object[tempFieldName] || object[tempFieldName].toString().trim() === '') {
                self.setState({
                  ...self.state,
                  errorScan: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
                });

                return false;
              }
            }

            return true;
          });

          if (!isValid) {
            return;
          }

          //check product, lotno, qty hợp lệ
          const matchingProducts = productList.filter(p => isEqual(p.productCode, object[`${taskTab}_product`]) && isEqual(p.lotNo, object[`${taskTab}_lotNo`]));

          if (matchingProducts.length === 0) {
            self.setState({
              ...self.state,
              loading: false,
              errorScan: `${i18n.t('incorrectProductScanned')}`,
            });

            return;
          }

          let isValidLotNo = false;
          let isValidQty = false;
          let productSelected = matchingProducts[0];

          // for (const productItem of matchingProducts) {
          //   const { lotNo, qty } = productItem;

          //   if (isEqual(lotNo, object[`${taskTab}_lotNo`])) {
          //     isValidLotNo = true;
          //   } else {
          //     isValidLotNo = false;
          //   }

          // if (object[`${taskTab}_qty`] && object[`${taskTab}_qty`] <= qty) {
          //   isValidQty = true;
          // } else {
          //   isValidQty = false;
          // }

          // if (isValidLotNo && isValidQty) {
          //   productSelected = productItem;
          //   break;
          // }
          //   if (isValidLotNo) {
          //     productSelected = productItem;
          //     break;
          //   }
          // }

          // if (!isValidLotNo && !isValidQty) {
          //   self.setState({
          //     ...self.state,
          //     loading: false,
          //     errorScan: `${i18n.t('incorrectProductScanned')}`,
          //   });
          //   return;
          // }

          // if (!isValidLotNo) {
          //   self.setState({
          //     ...self.state,
          //     loading: false,
          //     errorScan: `${i18n.t('incorrectLotNoScanned')}`,
          //   });
          //   return;
          // }

          // if (!isValidQty) {
          //   self.setState({
          //     ...self.state,
          //     loading: false,
          //     errorScan: `${i18n.t('incorrectQtyScanned')}`,
          //   });
          //   return;
          // }

          let packingUnitItem = {};
          let tempFieldSet = {};

          //lấy lên các trường trong refModel vào list
          const tmpTaskTabItemList = Object.keys(object)
            .filter(key => key.startsWith(`${taskTab}_`))
            .reduce((acc, key) => {
              acc[key] = object[key];
              return acc;
            }, {});

          const newTmpTaskTabItemList = Object.keys(tmpTaskTabItemList).reduce((acc, key) => {
            const newKey = key.startsWith(`${taskTab}_`) ? key.slice(taskTab.length + 1) : key; // Bỏ tiền tố "receiving_"
            acc[newKey] = tmpTaskTabItemList[key];
            return acc;
          }, {});

          packingUnitItem = {
            ...newTmpTaskTabItemList,
            ...packingUnitItem,
          };

          gridFieldList.map(({ fieldName, type, refModelName, persistOnScan }) => {
            if (type === DATA_TYPE.ID) {
              const { relatedFields } = refModels.find((f) => f.fieldName === `${gridListName}.${refModelName || fieldName}Id`);

              packingUnitItem[`${taskTab}_${fieldName}Id`] = object[`${taskTab}_${fieldName}Id`];
              tempFieldSet[`${taskTab}_${fieldName}Id`] = object[`${taskTab}_${fieldName}Id`];

              if (relatedFields) {
                relatedFields.forEach((field) => {
                  if (isObject(field)) {
                    const { fromField, toField } = field;

                    if (toField) {
                      packingUnitItem[`${toField}`] = _.isUndefined(object[`${taskTab}_${toField}`]) ? '' : object[`${taskTab}_${toField}`];
                    }
                  } else {
                    packingUnitItem[`${field}`] = _.isUndefined(object[`${taskTab}_${field}`]) ? '' : object[`${taskTab}_${field}`];
                  }
                });
              }

              if (relatedFields && persistOnScan) {
                relatedFields.forEach((field) => {
                  if (isObject(field)) {
                    const { fromField, toField } = field;

                    if (toField) {
                      tempFieldSet[`${taskTab}_${toField}`] = _.isUndefined(object[`${taskTab}_${toField}`]) ? '' : object[`${taskTab}_${toField}`];
                    }
                  } else {
                    tempFieldSet[`${taskTab}_${field}`] = _.isUndefined(object[`${taskTab}_${field}`]) ? '' : object[`${taskTab}_${field}`];
                  }
                });
              }

              if (relatedFields && !persistOnScan) {
                relatedFields.forEach((field) => {
                  if (isObject(field)) {
                    const { fromField, toField } = field;

                    if (toField) {
                      tempFieldSet[`${taskTab}_${toField}`] = '';
                    }
                  } else {
                    tempFieldSet[`${taskTab}_${field}`] = '';
                  }
                });
              }

            } else if (type === DATA_TYPE.STRING) {
              tempFieldSet[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
              if (persistOnScan) {
                tempFieldSet[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
              } else {
                tempFieldSet[`${taskTab}_${fieldName}`] = '';
              }
            } else if (type === DATA_TYPE.DATE || type === DATA_TYPE.DATE_TIME) {
              tempFieldSet[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
              if (persistOnScan) {
                tempFieldSet[`${taskTab}_${fieldName}`] = object[`${taskTab}_${fieldName}`];
              } else {
                tempFieldSet[`${taskTab}_${fieldName}`] = null;
              }
            }
          })

          if (Object.keys(packingUnitItem).length !== 0) {
            tempGridList.push(packingUnitItem);
          }

          //xóa các trường có dạng receiving_...
          Object.keys(object).forEach(key => {
            if (key.startsWith(`${taskTab}_`)) {
              delete object[key];
            }
          });

          //thêm lại các trường receiving_... đã set giá trị ban đầu
          Object.entries(tempFieldSet).forEach(([key, value]) => {
            object[key] = value;
          });

          console.log("🚀 ~QQQQQQQQQQQQQQ:", !(taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && isOkProductList))
          if (!(taskTab.toLowerCase() === TASK_TYPE_LIST.INSPECTION.toLowerCase() && !isOkProductList)) {
            self[`${taskTab}_tmpGridFieldList`] = cloneDeep(self[`${taskTab}_gridFieldList`]);
          }
          console.log("🚀 ~111111", JSON.stringify(tempFieldSet, null, 2))
          console.log("🚀 ~ 2222", JSON.stringify(tempGridList, null, 2))

          self.setState({
            ...self.state,
            readOnlyPersisField: true,
            object: {
              ...object,
              loading: false,
              [gridListName]: [
                ...tempGridList
              ],
              [`original_${gridListName}`]: [
                ...tempGridList
              ],
              ...tempFieldSet,
            },
            // modalScan: false,
            errorScan: '',
          });
        } else {
          return;
        }
      })
    }
  } catch (error) {
    console.log("🚀 ~ onScanSamePackageChange ~ error:", error)
  }
}

export const onAutoScanChange = async (self) => {
  self.setState({
    ...self.state,
    autoScan: !self.state.autoScan,
  });
}

export const onStart = async (self) => {
  try {
    self.setState(LOADING_STATE);
    const newState = cloneDeep(self.state);
    const { object, staffListSelected, pageLoad } = newState;
    const objectId = self.props.route.params.objectId;
    const clientContext = getApiContextFromSelf(self, object.taskTypeName);
    let errorList = [];
    const { serviceOrderId, dependencyAll } = object;

    if (dependencyAll.length) {
      const query = {
        serviceOrderId,
        taskTypeId: { $in: dependencyAll },
        fields: ['state', 'taskTypeId', 'taskCode', 'taskTypeName'],
      };

      const { error, data } = await apiGetList('v1/warehouseTasks', query, clientContext);

      if (error) {
        self.setState({
          loading: false,
          error: true,
          messages: apiErrorMessages(error),
        });
        return;
      }

      const taskList = data?.data || [];

      const unprocessedTasks = taskList
        .filter(item => item.state !== TASK_STATE.FINISHED)
        .map(item => item.taskCode);

      if (unprocessedTasks.length) {
        const tasks = unprocessedTasks.join(', ');
        errorList.push({
          name: i18n.t('dependencyAll'),
          message: i18n.t('dependencyError', { tasks }),
        });
      }
    }

    if (errorList.length) {
      self.setState({
        ...self.state,
        loading: false,
        error: true,
        messages: errorList,
      });

      return;
    }
    const { error, data } = await apiPost(`v1/warehouseTasks/warehouseTaskWorkflow/${objectId}`, object);

    if (error) {
      self.setState({
        loading: false,
        error: true,
        messages: error?.data?.error?.message,
      });

      return;
    }

    self.setState({
      ...self.state,
      loading: false,
      success: true,
      messages: `${i18n.t('msg.update.success')}`,
      object: {
        ...self.state.object,
        ...data.data,
      }
    });
  } catch (error) {
    self.setState({
      loading: false,
      error: true,
      messages: `${i18n.t('msg.update.failure')}`,
    });
  }
}

export const onUpdate = async (self) => {
  try {

    const newState = cloneDeep(self.state);
    const { object, staffListSelected, pageLoad } = newState;
    const {
      tmpOutputTaskTabList, currentTaskIndex,
      okProductList, ngProductList,
      okLocatorId, ngLocatorId,
      receivingList, scannedList,
      productList, packingList,
      packingLocatorId, staffList
    } = object;

    // const totalQtyPackingList = packingList.reduce((acc, item) => acc + Number(item.qty), 0)
    // console.log("🚀 ~ onUpdate ~ totalQtyPackingList:", totalQtyPackingList)
    // const totalQtyProductList = productList.reduce((acc, item) => acc + Number(item.qty), 0)
    // console.log("🚀 ~ onUpdate ~ totalQtyProductList:", totalQtyProductList)

    const objectId = self.props.route.params.objectId;
    let errorList = [];

    let curTaskTab = tmpOutputTaskTabList[currentTaskIndex];

    if (currentTaskIndex === tmpOutputTaskTabList.length) {
      curTaskTab = tmpOutputTaskTabList[currentTaskIndex - 1];
    }

    let curTaskTabName = curTaskTab ? curTaskTab.taskTab : '';

    // if (curTaskTabName === TASK_TAB_LIST.PACKING) {
    //   if (staffList.length === 0) {
    //     self.setState({
    //       loading: false,
    //       error: true,
    //       success: false,
    //       messages: `${i18n.t('staffList')}: ${i18n.t('isEmpty')}`,
    //     });
    //     return;
    //   }
    //   if (!packingLocatorId) {
    //     self.setState({
    //       loading: false,
    //       error: true,
    //       success: false,
    //       messages: `${i18n.t('packingLocator')}: ${i18n.t('isRequired')}`,
    //     });
    //     return;
    //   }
    //   if (totalQtyPackingList < totalQtyProductList) {
    //     self.setState({
    //       loading: false,
    //       error: true,
    //       success: false,
    //       messages: `${i18n.t('inputAndRequestMustBeEqual')}`,
    //     });
    //     return;
    //   }
    //   if (totalQtyPackingList > totalQtyProductList) {
    //     self.setState({
    //       loading: false,
    //       error: true,
    //       success: false,
    //       messages: `${i18n.t('insufficientPackagingQuantity')}`,
    //     });
    //     return;
    //   }
    // }

    // if (!staffListSelected || !staffListSelected.length) {
    //   self.setState({
    //     loading: false,
    //     error: true,
    //     success: false,
    //     messages: `${i18n.t('staff')}: ${i18n.t('isRequired')}`,
    //   });

    //   return;
    // }

    // for (const outputTaskTabItem of tmpOutputTaskTabList) {
    //   const { taskTab } = outputTaskTabItem;
    //   if (isEqual(taskTab, TASK_TYPE_LIST.INSPECTION)) {
    //     if (okProductList.length && !isObjectId(okLocatorId)) {
    //       self.setState({
    //         loading: false,
    //         success: false,
    //         error: true,
    //         messages: `${i18n.t('okLocatorId')}: ${i18n.t('isRequired')}`,
    //       });
    //       return;
    //     }

    //     if (ngProductList.length && !isObjectId(ngLocatorId)) {
    //       self.setState({
    //         loading: false,
    //         success: false,
    //         error: true,
    //         messages: `${i18n.t('ngLocatorId')}: ${i18n.t('isRequired')}`,
    //       });
    //       return;
    //     }
    //   }
    // }

    const uniqueStaffListSelected = Array.from(new Set(staffListSelected));
    const staffOptions = pageLoad[`staffList.staffId`].data;
    let newStaffList = [];
    uniqueStaffListSelected.map(staffSelectedValue => {
      const staffSelectedItem = staffOptions.find(e => equalToId(e._id, staffSelectedValue));
      newStaffList.push({
        staffId: staffSelectedItem._id,
        staffUserName: staffSelectedItem.userName,
        staffFullName: staffSelectedItem.fullName
      })
    })

    object.staffList = newStaffList;

    // let isValid = true;

    // tmpOutputTaskTabList.forEach(({ taskTab }) => {
    //   const flatFieldList = self[`${taskTab}_flatFieldList`];
    //   if (flatFieldList) {
    //     const validFields = flatFieldList.every(({ fieldName, alt, isRequired, type }) => {
    //       if (isRequired) {
    //         let tempFieldName = type === DATA_TYPE.ID ? `${fieldName}Id` : fieldName;

    //         if (!object[tempFieldName] || object[tempFieldName].toString().trim() === '') {
    //           if (isValid) {
    //             self.setState({
    //               ...self.state,
    //               error: true,
    //               success: false,
    //               messages: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
    //             });
    //           }
    //           isValid = false;
    //           return false;
    //         }
    //       }
    //       return true;
    //     });

    //     if (!validFields) {
    //       isValid = false;
    //     }
    //   }
    // });

    // if (!isValid) {
    //   return;
    // }

    // if (curTaskTabName == TASK_TYPE_LIST.RECEIVING) {
    //   if (receivingList.length) {
    //     for (const receivingItem of receivingList) {
    //       const { isSerialized, qty, packingUnitCode, productCode, lotNo } = receivingItem;

    //       if (isSerialized) {
    //         const newScannedList = scannedList.map((scannedItem, index) => ({
    //           ...scannedItem,
    //           index: index
    //         }));

    //         const productListByPackingUnit = newScannedList.filter(s => isEqual(s.packingUnitCode, packingUnitCode));
    //         const scannedQty = productListByPackingUnit.length;
    //         // console.log(qty, "=======", productListByPackingUnit.length)

    //         if (!isEqual(Number(qty), scannedQty)) {
    //           errorList.push({
    //             name: i18n.t('scannedList'),
    //             message: `${i18n.t('validateScanQty', { productCode, scannedQty, qty })}`,
    //           });
    //         }

    //         productListByPackingUnit.forEach((product) => {
    //           const { index, serialNo: serialNoItem, packingUnitCode: packingUnitItemCode, productCode: productItemCode, lotNo: lotNoItem } = product;
    //           if (serialNoItem.toString().trim() === '') {
    //             errorList.push({
    //               name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('serialNo')}]`,
    //               message: i18n.t('isRequired'),
    //             });
    //           }

    //           if (!isEqual(packingUnitCode, packingUnitItemCode)) {
    //             errorList.push({
    //               name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('packingUnitId')}]`,
    //               message: i18n.t('msg.validate.failure'),
    //             });
    //           }

    //           if (!isEqual(productCode, productItemCode)) {
    //             errorList.push({
    //               name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('productCode')}]`,
    //               message: i18n.t('msg.validate.failure'),
    //             });
    //           }

    //           if (!isEqual(lotNo, lotNoItem)) {
    //             errorList.push({
    //               name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('lotNo')}]`,
    //               message: i18n.t('validateScanLotNo'),
    //             });
    //           }
    //         });
    //       }
    //     }
    //   }
    //   if (errorList.length > 0) {
    //     self.setState({
    //       loading: false,
    //       success: false,
    //       error: true,
    //       messages: errorList,
    //     });

    //     return;
    //   }
    // }

    const newObject = {
      ...cloneDeep(object),
      tabName: curTaskTabName,
    }

    const { error, data } = await apiPost(`v1/warehouseTasks/updateTask/${objectId}`, newObject);

    // const { error, data } = await apiPost(`v1/warehouseTasks/scanned/${objectId}`, newObject);
    //update packingUnit
    const packingUnitByCode = _.groupBy(receivingList, 'packingUnitCode')

    if (error) {
      self.setState({
        loading: false,
        error: true,
        messages: error?.data?.error?.message,
      });

      return;
    }

    self.setState({
      loading: false,
      error: false,
      success: true,
      messages: `${i18n.t('msg.update.success')}`,
    });

  } catch (error) {
    console.log("🚀 ~ onUpdate ~ error:", JSON.stringify(error, null, 2))
    self.setState({
      loading: false,
      success: false,
      error: true,
      messages: `${i18n.t('msg.update.failure')}`,
    });
  }
}

export const onDeleteGridListItem = async (self, gridListName, data) => {
  try {
    const newState = cloneDeep(self.state);
    const { object } = newState;
    const gridList = object[gridListName];

    const updatedGridList = gridList.filter(item => {
      return !isEqual(item, data);
    });

    object[gridListName] = updatedGridList;
    object[`original_${gridListName}`] = updatedGridList;

    self.setState({
      ...newState,
      object,
    });

  } catch (error) {
    console.log(error);
  }
};


export function onSelectionChange(self, itemValue, fieldName, modelName, taskTab) {
  const value = itemValue.key;
  if (!value) {
    return;
  }

  const { object, pageLoad, refModels } = self.state;
  const { relatedFields, fieldName: refFieldName } = refModels.find((f) => f.fieldName === `${fieldName}Id`);

  const selectedItem = pageLoad[`${modelName}Id`]?.data.find((item) => String(item._id) === String(value));

  object[`${taskTab}_${fieldName}Id`] = selectedItem._id;

  if (relatedFields) {
    relatedFields.forEach((field) => {
      if (isObject(field)) {
        const { fromField, toField } = field;

        if (toField) {
          object[`${taskTab}_${toField}`] = value ? selectedItem[fromField] : '';
        }
      } else {
        object[`${taskTab}_${field}`] = value ? selectedItem[field] : '';
      }
    });
  }

  self.setState({
    ...self.state,
    object: {
      ...object,
    }
  });
};

export function onSelectionFlatFieldListChange(self, itemValue, fieldName, modelName, taskTab) {
  const value = itemValue.key;

  const { object, pageLoad, refModels } = self.state;

  const { relatedFields, fieldName: refFieldName } = refModels.find((f) => f.fieldName === `${fieldName}Id`);

  const selectedItem = pageLoad[`${modelName}Id`]?.data.find((item) => String(item._id) === String(value));

  object[`${fieldName}Id`] = value;

  if (relatedFields) {
    if (selectedItem) {
      relatedFields.forEach((field) => {
        if (isObject(field)) {
          const { fromField, toField } = field;

          if (toField) {
            object[toField] = itemValue ? selectedItem[fromField] : '';
          }
        } else {
          object[field] = itemValue ? selectedItem[field] : '';
        }
      });
    } else {
      relatedFields.forEach((field) => {
        if (isObject(field)) {
          const { fromField, toField } = field;

          if (toField) {
            object[toField] = '';
          }
        } else {
          object[field] = '';
        }
      });
    }

  }

  self.setState({
    ...self.state,
    object: {
      ...object,
    }
  });
};

export function onSelectionFieldChange(self, itemValue, fieldName) {
  const { object, pageLoad, refModels } = self.state;

  const { relatedFields, fieldName: refFieldName } = refModels.find((f) => f.fieldName === `${fieldName}Id`);

  const selectedItem = pageLoad[refFieldName]?.data.find((item) => String(item._id) === String(itemValue));

  object[`${fieldName}Id`] = itemValue;

  if (relatedFields) {
    relatedFields.forEach((field) => {
      if (isObject(field)) {
        const { fromField, toField } = field;

        if (toField) {
          object[toField] = itemValue ? selectedItem[fromField] : '';
        }
      } else {
        object[field] = itemValue ? selectedItem[field] : '';
      }
    });
  }

  self.setState({
    ...self.state,
    object: {
      ...object,
    }
  });
};

export const onPackingUnitTypeChange = async (self, event, data, index, name) => {
  event.preventDefault();
  const { object, pageLoad } = self.state;
  const { value } = data;
  const splitNameList = name.split('.');

  const packingUnitType = pageLoad?.packingUnitTypeId?.data.find((item) => String(item._id) === String(value));

  const updatedList = [...object[splitNameList[0]]];
  const { relatedFields } = pageLoad[name];

  updatedList[index] = {
    ...updatedList[index],
    [splitNameList[1]]: value,
  };

  if (relatedFields) {
    relatedFields.forEach((field) => {
      if (isObject(field)) {
        const { fromField, toField } = field;

        if (toField) {
          updatedList[index] = {
            ...updatedList[index],
            [toField]: value ? packingUnitType[fromField] : '',
          };
        }
      } else {
        updatedList[index] = {
          ...updatedList[index],
          [field]: value ? packingUnitType[field] : '',
        };
      }
    });
  }

  self.setState({
    ...self.state,
    object: {
      ...object,
      [splitNameList[0]]: updatedList
    }
  });
};

export function onDateTimeChange(self, value, fieldName) {
  const { object } = self.state;
  if (object[`${fieldName}IsShown`] && !object[`${fieldName}isShownTimePicker`]) {
    self.setState({
      object: {
        ...object,

        [fieldName]: value,
        [`${fieldName}IsShown`]: false,
        [`${fieldName}isShownTimePicker`]: true,
      },
    });

    return;
  }

  if (!object[`${fieldName}IsShown`] && object[`${fieldName}isShownTimePicker`]) {
    self.setState({
      object: {
        ...object,

        [fieldName]: value,
        [`${fieldName}IsShown`]: false,
        [`${fieldName}isShownTimePicker`]: false,
      },
    });

    return;
  }

};

export function onDateChange(self, value, fieldName) {
  const { object } = self.state;
  self.setState({
    object: {
      ...object,

      [fieldName]: value,
      [`${fieldName}IsShown`]: false,
    },
  });

  return;
};

export function getTempDefaultValue(taskTab, fieldName, dataType) {
  switch (dataType) {
    case DATA_TYPE.ID: {
      return {
        [`${taskTab}_${fieldName}Id`]: null,
        [`${taskTab}_${fieldName}Code`]: '',
        [`${taskTab}_${fieldName}Name`]: '',
      };
    }

    case DATA_TYPE.BOOLEAN:
    case DATA_TYPE.BOOL: {
      return { [`${taskTab}_${fieldName}`]: null };
    }

    case DATA_TYPE.ARRAY: {
      return { [`${taskTab}_${fieldName}`]: [] };
    }

    case DATA_TYPE.OBJECT: {
      return { [`${taskTab}_${fieldName}`]: {} };
    }

    case DATA_TYPE.DATE: {
      return {
        [`${taskTab}_${fieldName}`]: null,
        [`${taskTab}_${fieldName}IsShown`]: false,
        [`${taskTab}_${fieldName}isShownTimePicker`]: false,
      };
    }

    case DATA_TYPE.DATE_TIME: {
      return {
        [`${taskTab}_${fieldName}`]: (new Date()),
        [`${taskTab}_${fieldName}IsShown`]: false,
        [`${taskTab}_${fieldName}isShownTimePicker`]: false,
      };
    }

    case DATA_TYPE.STRING: {
      return { [`${taskTab}_${fieldName}`]: "" };
    }

    case DATA_TYPE.NUMBER: {
      return { [`${taskTab}_${fieldName}`]: 0 };
    }

    default: {
      return { [`${taskTab}_${fieldName}`]: "" };
    }
  }
}

export const onSearchTextFieldChange = async (self, data, field, subField) => {
  self.setState(prevState => ({
    ...prevState,
    [field]: {
      ...prevState[field],
      [subField]: data,
    },
  }));
};

export const onSearchSelectionFieldChange = async (self, data, field, subField) => {
  self.setState(prevState => ({
    ...prevState,
    [field]: {
      ...prevState[field],
      [subField]: data.value,
    },
  }));
};

export const onSearchDateFieldChange = async (self, data, field, subField) => {
  const { object, objectList } = self.state;

  if (!_.isEmpty(object)) {
    self.setState((prevState) => ({
      ...prevState,
      object: {
        ...prevState.object,
        [`${subField}IsShown`]: false,
      },
      [field]: {
        ...prevState[field],
        [subField]: new Date(data),
      },
    }));
  } else if (!_.isEmpty(objectList)) {
    self.setState((prevState) => ({
      ...prevState,
      objectList: {
        ...prevState.objectList,
        [`${subField}IsShown`]: false,
      },
      [field]: {
        ...prevState[field],
        [subField]: new Date(data),
      },
    }));
  }
};

export const onCheckinPress = (self) => {
  self.setState({ isModalVisible: true });
};

export const onCancel = (self) => {
  self.setState({ isModalVisible: false }); // Ẩn modal khi hủy
};

// export const onStaffMultipleSelectionChange = async (self, data) => {
//   const { pageLoad, object } = self.state;
//   const { staffList, staffListSelected } = object;

//   const staffIndex = staffList.findIndex(staffItem =>
//     staffItem.staffId && isObjectId(staffItem.staffId) && equalToId(staffItem.staffId, data)
//   );

//   const staffOptions = pageLoad[`staffList.staffId`].data;
//   const staffSelected = staffOptions.find(e => e._id === data);

//   if (staffIndex > -1) {
//     staffListSelected.splice(staffIndex, 1);
//     staffList.splice(staffIndex, 1);
//   } else if (staffSelected) {
//     staffListSelected.push(data);
//     staffList.push(staffSelected);
//   }

//   self.setState({
//     object: {
//       ...object,
//       staffList,
//       staffListSelected
//     },
//   });
// };

export const onPickMaterialModalOpen = async (self, data) => {
  const { object, pageLoad, refModels } = self.state;
  const { productList } = object;

  let originLine = productList.filter(f => String(f.productId) === String(data.productId));
  if (originLine && originLine.length > 1) {
    originLine = productList.filter(f => String(f.productId) === String(data.productId) && f.lotNo === data.lotNo);
  }

  const pickingOriginLineRefModel = refModels.find(f => f.fieldName === 'pickingList.originLineId');
  const pickingOriginLinePageLoad = {
    fieldName: pickingOriginLineRefModel.fieldName,
    refKeyField: pickingOriginLineRefModel.refKeyField,
    relatedFields: pickingOriginLineRefModel.relatedFields,
    data: [{
      ...data,
      _id: originLine[0]._id,
    }],
  };

  pageLoad[`pickingList.originLineId`] = pickingOriginLinePageLoad;

  const {
    companyId, warehouseId, storeLocatorId,
    storeId, productId, lotNo,
    packingUnitId, packingUnitCode
  } = data;

  let query = {
    companyId,
    warehouseId,
    storeLocatorId,
    storeId,
    productId,
    isInventory: true,
    lotNo,
    packingUnitCode,
    toDate: new Date()
  };

  const clientContext = getApiContextFromSelf(self, object.taskTypeName);
  let { error, data: stockData } = await apiGetList('v1/stockJournals/stockInventoryByLot', query, { ...clientContext });

  if (error) {
    self.setState({
      loading: false,
      error: true,
      messages: 'Server error',
    });

    return;
  }

  const { productLineAll: stockList } = stockData.data;
  let actualInventory = 0;
  let projectedInventory = 0;

  if (stockList && stockList.length && Number(stockList[0].actualInventory) > 0) {
    actualInventory = Number(stockList[0].actualInventory);
  }

  if (stockList && stockList.length && Number(stockList[0].projectedInventory) > 0) {
    projectedInventory = Number(stockList[0].projectedInventory);
  }

  let { data: { data: resultPu } } = await apiGetById(
    'v1/packingUnits',
    packingUnitId,
    ['productAll'],
    false,
    clientContext
  );

  let productInPu = resultPu.productAll.filter(f => String(f.productId) === String(productId));
  if (productInPu && productInPu.length > 1) {
    productInPu = resultPu.productAll.filter(f => String(f.productId) === String(productId) && f.lotNo === lotNo);
  }

  self.setState({
    ...self.state,
    pageLoad: {
      ...pageLoad,
    },
    object: {
      ...self.state.object,
      pickMaterialModalVisible: true,
      isPickInstruction: true,
      currentPick: {
        ...data,
        originLineId: originLine[0]._id,
        productQtyInPu: productInPu[0].qty,
        actualInventory,
        projectedInventory,
      },
    }
  })
};

export const onPickingLocatorChange = async (self, data) => {
  const value = data;
  const { object, pageLoad, refModels } = self.state;
  const changedFields = createDraft(object);
  const storeLocator = pageLoad.pickedStoreLocatorId?.data.find((item) => String(item.storeLocatorCode) === String(value));

  changedFields.currentPick = storeLocator
    ? {
      ...changedFields.currentPick,
      storeLocatorId: storeLocator._id,
      ...omit(storeLocator, ['_id']),
    }
    : {
      ...changedFields.currentPick,
      storeLocatorId: null,
      storeLocatorCode: value,
      storeLocatorName: '',
      storeLocatorTypeId: null,
      storeLocatorTypeCode: '',
      storeLocatorTypeName: '',
      maxWidth: null,
      maxDepth: null,
      maxHeight: null,
      maxWeight: null,
      maxVolume: null,
      storeSectionId: null,
      storeSectionCode: '',
      storeSectionName: '',
      storeId: null,
      storeCode: '',
      storeName: '',
      storeTypeId: null,
      storeTypeCode: '',
      storeTypeName: '',
      isPendingReceipt: null,
      isPendingShipment: null,
      isWIP: null,
      isInventory: null,
      warehouseId: null,
      warehouseCode: '',
      warehouseName: '',
      departmentId: null,
      departmentCode: '',
      departmentName: '',
      companyId: null,
      companyCode: '',
      companyName: '',
    };

  const { productList, currentPick } = changedFields;
  const { storeLocatorId } = currentPick;
  const clientContext = getApiContextFromSelf(self, changedFields.taskTypeName);

  const pickingOriginLineRefModel = refModels.find(f => f.fieldName === 'pickingList.originLineId');
  const pickingOriginLinePageLoad = {
    fieldName: pickingOriginLineRefModel.fieldName,
    refKeyField: pickingOriginLineRefModel.refKeyField,
    relatedFields: pickingOriginLineRefModel.relatedFields,
    data: [],
  };

  if (storeLocator) {
    const uniqProductId = [...new Set(productList.map(r => r.productId))];
    const { error: errorPu, data: resultPu } = await apiGetList(
      'v1/packingUnits',
      {
        'productAll.productId': { $in: uniqProductId },
        'storeLocatorId': storeLocatorId,
      },
      {
        ...clientContext,
        policyContext: 'productId',
      }
    );

    if (errorPu) {
      self.setState({
        loading: false,
        error: true,
        messages: 'Server error',
      });

      return;
    }

    const puList = resultPu.data;
    for (const packingUnit of puList) {
      const {
        _id: packingUnitId, packingUnitCode, packingUnitName, packingUnitNumber,
        packingUnitTypeId, packingUnitTypeCode, packingUnitTypeName,
        puTypeWidth, puTypeDepth, puTypeHeight,
        puTypeMaxWeight, puTypeVolume,
        productAll,
      } = packingUnit;

      for (const product of productAll) {
        const {
          _id: originLineId,
          productId, productCode, productName, productVolume,
          productSegmentId, productSegmentCode, productSegmentName, isSerialized,
          uomId, uomCode, uomName, documentTypeList,
          expDate, lotDate, lotNo, qty,
        } = product;

        if (uniqProductId.includes(productId)) {
          pickingOriginLinePageLoad.data.push({
            _id: originLineId,
            packingUnitId, packingUnitCode, packingUnitName, packingUnitNumber,
            packingUnitTypeId, packingUnitTypeCode, packingUnitTypeName,
            puTypeWidth, puTypeDepth, puTypeHeight,
            puTypeMaxWeight, puTypeVolume,
            productId, productCode, productName, productVolume,
            productSegmentId, productSegmentCode, productSegmentName, isSerialized,
            uomId, uomCode, uomName, documentTypeList,
            expDate, lotDate, lotNo, qty,
          });
        }
      }
    }

    pageLoad[`pickingList.originLineId`] = pickingOriginLinePageLoad;

    const { data: { data: checkLocked } } = await apiGetById(
      'v1/storeLocators',
      storeLocatorId,
      ['productList'],
      false,
      clientContext
    );

    const dataOriginLine = pickingOriginLinePageLoad.data;
    const filteredProducts = dataOriginLine.map(item => {
      const isLocked = checkLocked.productList.some(
        (product) => String(product.productId) === String(item.productId) && product.locked === false
      );

      return isLocked ? item : null;
    });
    const pickingOriginLinePageLoadData = filteredProducts.filter((product) => product !== null);
    pageLoad[`pickingList.originLineId`].data = pickingOriginLinePageLoadData;
  } else {
    pageLoad[`pickingList.originLineId`] = pickingOriginLinePageLoad;
  }

  changedFields.currentPick = {
    ...changedFields.currentPick,
    originLineId: null,
    packingUnitId: null,
    packingUnitId: null,
    packingUnitCode: '',
    packingUnitName: '',
    packingUnitNumber: null,
    packingUnitTypeId: null,
    packingUnitTypeCode: null,
    packingUnitTypeName: null,
    puTypeWidth: null,
    puTypeDepth: null,
    puTypeHeight: null,
    puTypeMaxWeight: null,
    puTypeVolume: null,
    productId: null,
    productCode: '',
    productName: '',
    productVolume: null,
    productSegmentId: null,
    productSegmentCode: '',
    productSegmentName: '',
    isSerialized: false,
    uomId: null,
    uomCode: '',
    uomName: '',
    documentTypeList: [],
    expDate: null,
    lotDate: null,
    lotNo: '',
    qty: null,
    productQtyInPu: 0,
    actualInventory: 0,
    projectedInventory: 0,
  }

  let newState = finishDraft(changedFields);

  self.setState({
    ...self.state,
    pageLoad: {
      ...pageLoad,
    },
    object: {
      ...object,
      ...newState
    }
  });
};

export const onPickingOriginLineChange = async (self, data) => {
  const value = data;
  const { object, pageLoad } = self.state;
  const changedFields = createDraft(object);
  const originLine = pageLoad['pickingList.originLineId']?.data.find((item) => String(item.packingUnitCode) === String(value));

  changedFields.currentPick = originLine
    ? {
      ...changedFields.currentPick,
      ...omit(originLine, ['_id']),
      originLineId: null,
      productId: null,
      productCode: '',
      productName: '',
      productVolume: null,
      productSegmentId: null,
      productSegmentCode: '',
      productSegmentName: '',
      isSerialized: false,
      uomId: null,
      uomCode: '',
      uomName: '',
      documentTypeList: [],
      expDate: null,
      lotDate: null,
      lotNo: '',
      qty: null,
      productQtyInPu: 0,
      actualInventory: 0,
      projectedInventory: 0,
    }
    : {
      ...changedFields.currentPick,
      originLineId: null,
      packingUnitId: null,
      packingUnitId: null,
      packingUnitCode: value,
      packingUnitName: '',
      packingUnitNumber: null,
      packingUnitTypeId: null,
      packingUnitTypeCode: null,
      packingUnitTypeName: null,
      puTypeWidth: null,
      puTypeDepth: null,
      puTypeHeight: null,
      puTypeMaxWeight: null,
      puTypeVolume: null,
      productId: null,
      productCode: '',
      productName: '',
      productVolume: null,
      productSegmentId: null,
      productSegmentCode: '',
      productSegmentName: '',
      isSerialized: false,
      uomId: null,
      uomCode: '',
      uomName: '',
      documentTypeList: [],
      expDate: null,
      lotDate: null,
      lotNo: '',
      qty: null,
      productQtyInPu: 0,
      actualInventory: 0,
      projectedInventory: 0,
    };

  const { currentPick } = changedFields;
  const {
    companyId, warehouseId, storeLocatorId,
    storeId, productId, lotNo, packingUnitCode
  } = currentPick;

  const clientContext = getApiContextFromSelf(self, changedFields.taskTypeName);

  if (!companyId || !warehouseId || !storeLocatorId || !storeId || !productId) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: 0,
      projectedInventory: 0,
    }

    let newState = finishDraft(changedFields);
    self.setState({
      ...self.state,
      object: {
        ...object,
        ...newState
      }
    });

    return;
  }

  let query = {
    companyId,
    warehouseId,
    storeLocatorId,
    storeId,
    productId,
    isInventory: true,
    lotNo,
    packingUnitCode,
    toDate: new Date()
  };

  let { error, data: stockData } = await apiGetList('v1/stockJournals/stockInventoryByLot', query, { ...clientContext });

  if (error) {
    self.setState({
      loading: false,
      error: true,
      messages: 'Server error',
    });

    return;
  }

  const { productLineAll: stockList } = stockData.data;

  if (stockList && stockList.length && Number(stockList[0].projectedInventory) > 0) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      projectedInventory: Number(stockList[0].projectedInventory),
    }
  } else {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      projectedInventory: 0,
    }
  }

  if (stockList && stockList.length && Number(stockList[0].actualInventory) > 0) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: Number(stockList[0].actualInventory),
    }
  } else {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: 0,
    }
  }

  let newState = finishDraft(changedFields);
  self.setState({
    ...self.state,
    object: {
      ...object,
      ...newState
    }
  });
};

export const onPickingProductChange = async (self, data) => {
  const value = data;
  const { object, pageLoad } = self.state;
  const changedFields = createDraft(object);

  const originLine = pageLoad['pickingList.originLineId']?.data.find(
    (item) => String(item.productCode) === String(value) &&
      String(item.packingUnitCode) === String(changedFields.currentPick.packingUnitCode)
  );

  changedFields.currentPick = originLine
    ? {
      ...changedFields.currentPick,
      ...omit(originLine, ['_id', 'qty']),
      originLineId: originLine._id,
      productQtyInPu: originLine.qty,
      actualInventory: 0,
      projectedInventory: 0,
    }
    : {
      ...changedFields.currentPick,
      originLineId: null,
      productId: null,
      productCode: value,
      productName: '',
      productVolume: null,
      productSegmentId: null,
      productSegmentCode: '',
      productSegmentName: '',
      isSerialized: false,
      uomId: null,
      uomCode: '',
      uomName: '',
      documentTypeList: [],
      expDate: null,
      lotDate: null,
      lotNo: '',
      qty: null,
      productQtyInPu: 0,
      actualInventory: 0,
      projectedInventory: 0,
    };

  const { currentPick } = changedFields;
  const {
    companyId, warehouseId, storeLocatorId,
    storeId, productId, lotNo, packingUnitCode
  } = currentPick;

  const clientContext = getApiContextFromSelf(self, changedFields.taskTypeName);

  if (!companyId || !warehouseId || !storeLocatorId || !storeId || !productId) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: 0,
      projectedInventory: 0,
    }

    let newState = finishDraft(changedFields);
    self.setState({
      ...self.state,
      object: {
        ...object,
        ...newState
      }
    });

    return;
  }

  let query = {
    companyId,
    warehouseId,
    storeLocatorId,
    storeId,
    productId,
    isInventory: true,
    lotNo,
    packingUnitCode,
    toDate: new Date()
  };

  let { error, data: stockData } = await apiGetList('v1/stockJournals/stockInventoryByLot', query, { ...clientContext });

  if (error) {
    self.setState({
      loading: false,
      error: true,
      messages: 'Server error',
    });

    return;
  }

  const { productLineAll: stockList } = stockData.data;

  if (stockList && stockList.length && Number(stockList[0].projectedInventory) > 0) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      projectedInventory: Number(stockList[0].projectedInventory),
    }
  } else {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      projectedInventory: 0,
    }
  }

  if (stockList && stockList.length && Number(stockList[0].actualInventory) > 0) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: Number(stockList[0].actualInventory),
    }
  } else {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: 0,
    }
  }

  let newState = finishDraft(changedFields);
  self.setState({
    ...self.state,
    object: {
      ...object,
      ...newState
    }
  });
};

export const onPickingLotNoChange = async (self, data) => {
  const value = data;
  const { object, pageLoad } = self.state;
  const changedFields = createDraft(object);

  const originLine = pageLoad['pickingList.originLineId']?.data.find(
    (item) => String(item.lotNo) === String(value) &&
      String(item.productCode) === String(changedFields.currentPick.productCode) &&
      String(item.packingUnitCode) === String(changedFields.currentPick.packingUnitCode)
  );

  changedFields.currentPick = originLine
    ? {
      ...changedFields.currentPick,
      ...omit(originLine, ['_id', 'qty']),
      originLineId: originLine._id,
      productQtyInPu: originLine.qty,
      actualInventory: 0,
      projectedInventory: 0,
    }
    : {
      ...changedFields.currentPick,
      originLineId: null,
      expDate: null,
      lotDate: null,
      lotNo: value,
      qty: null,
      productQtyInPu: 0,
      actualInventory: 0,
      projectedInventory: 0,
    };

  const { currentPick } = changedFields;
  const {
    companyId, warehouseId, storeLocatorId,
    storeId, productId, lotNo, packingUnitCode
  } = currentPick;

  const clientContext = getApiContextFromSelf(self, changedFields.taskTypeName);

  if (!companyId || !warehouseId || !storeLocatorId || !storeId || !productId) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: 0,
      projectedInventory: 0,
    }

    let newState = finishDraft(changedFields);
    self.setState({
      ...self.state,
      object: {
        ...object,
        ...newState
      }
    });

    return;
  }

  let query = {
    companyId,
    warehouseId,
    storeLocatorId,
    storeId,
    productId,
    isInventory: true,
    lotNo,
    packingUnitCode,
    toDate: new Date()
  };

  let { error, data: stockData } = await apiGetList('v1/stockJournals/stockInventoryByLot', query, { ...clientContext });

  if (error) {
    self.setState({
      loading: false,
      error: true,
      messages: 'Server error',
    });

    return;
  }

  const { productLineAll: stockList } = stockData.data;

  if (stockList && stockList.length && Number(stockList[0].projectedInventory) > 0) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      projectedInventory: Number(stockList[0].projectedInventory),
    }
  } else {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      projectedInventory: 0,
    }
  }

  if (stockList && stockList.length && Number(stockList[0].actualInventory) > 0) {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: Number(stockList[0].actualInventory),
    }
  } else {
    changedFields.currentPick = {
      ...changedFields.currentPick,
      actualInventory: 0,
    }
  }

  let newState = finishDraft(changedFields);
  self.setState({
    ...self.state,
    object: {
      ...object,
      ...newState
    }
  });
};

export const onPickingQtyChange = async (self, data) => {
  const { object } = self.state;
  const changedFields = createDraft(object);

  changedFields.currentPick = {
    ...changedFields.currentPick,
    qty: data ? Math.abs(Number(data)) : 0,
  };

  let newState = finishDraft(changedFields);
  self.setState({
    ...self.state,
    object: {
      ...object,
      ...newState
    }
  });
};

export const onConfirmPicking = async (self, scanType) => {
  const { object } = self.state;
  const { _id: objectId, productList, currentPick, pickingList } = object;

  const {
    productCode,
    storeLocatorId, packingUnitId,
    qty, actualInventory
  } = currentPick;

  if (!storeLocatorId) {
    Alert.alert(i18n.t('storeLocatorId'), i18n.t('validateFailure'));

    return;
  }

  if (!packingUnitId) {
    Alert.alert(i18n.t('packingUnitId'), i18n.t('validateFailure'));

    return;
  }

  if (!qty) {
    Alert.alert(i18n.t('qty'), i18n.t('validateFailure'));

    return;
  }

  if (!actualInventory || Number(actualInventory) < Number(qty)) {
    Alert.alert(i18n.t('productId'), i18n.t('notEnoughStock'));

    return;
  }

  const requestQty = productList.reduce((sum, item) => {
    return item.productCode === productCode
      ? sum + Number(item.qty)
      : sum;
  }, 0);

  const totalPickedQty = pickingList.reduce((sum, item) => {
    return item.productCode === productCode
      ? sum + Number(item.qty)
      : sum;
  }, 0);

  const remainingQty = Number(requestQty) - Number(totalPickedQty);

  if (Number(qty) > Number(remainingQty)) {
    Alert.alert(
      i18n.t('qty'),
      `${i18n.t('requestedQty')}: ${requestQty}\n` +
      `${i18n.t('pickedQty')}: ${totalPickedQty}\n` +
      `${i18n.t('remainingQty')}: ${remainingQty}\n` +
      `${i18n.t('enteredQtyExceedsRemainingQtyMsg', { qty })}`
    );

    return;
  }

  const clientContext = getApiContextFromSelf(self, object.taskTypeName);
  const postData = {
    _id: objectId,
    picked: currentPick,
  };

  let { error, data } = await apiPost(`v1/warehouseTasks/updatePick/${objectId}`, postData, clientContext);

  if (error) {
    Alert.alert(i18n.t('serverError'));

    return;
  }

  let newPickMaterialModalVisible = false;
  let newCurrentPick = {};

  if (scanType !== 'scan') {
    newPickMaterialModalVisible = true;
  }

  if (scanType === 'scanSamePackage') {
    newCurrentPick = {
      ...currentPick,
      originLineId: null,
      productId: null,
      productCode: '',
      productName: '',
      productVolume: null,
      productSegmentId: null,
      productSegmentCode: '',
      productSegmentName: '',
      isSerialized: false,
      uomId: null,
      uomCode: '',
      uomName: '',
      documentTypeList: [],
      expDate: null,
      lotDate: null,
      lotNo: '',
      qty: null,
      productQtyInPu: 0,
      actualInventory: 0,
      projectedInventory: 0,
    }
  }

  self.setState({
    ...self.state,
    object: {
      ...self.state.object,
      ...data.data,
      pickMaterialModalVisible: newPickMaterialModalVisible,
      isPickInstruction: false,
      currentPick: newCurrentPick,
    }
  })

  if (scanType === 'scanNewPackage') {
    self.currentPickRef.storeLocatorCode.current.focus();
  }

  if (scanType === 'scanSamePackage') {
    self.currentPickRef.productCode.current.focus();
  }
};

export const onUnusualItemModalOpen = async (self, data) => {
  const { object } = self.state;
  const { currentPick } = object;

  const unusualItem = {
    ...omit(currentPick, ['_id, originLineId']),
    originLineId: currentPick._id,

    actualQty: 0,
    unusualTypeId: null,
    unusualTypeCode: '',
    unusualTypeName: '',
    note: '',
  };

  self.setState({
    ...self.state,
    object: {
      ...self.state.object,
      unusualItemModalVisible: true,
      unusualItem,
    }
  })
};

export const onUnusualTypeChange = async (self, data) => {
  const value = data.value;
  const { object, pageLoad } = self.state;
  const changedFields = createDraft(object);
  const unusualType = pageLoad.unusualTypeId?.data.find((item) => String(item._id) === String(value));

  changedFields.unusualItem = unusualType
    ? {
      ...changedFields.unusualItem,
      unusualTypeId: unusualType._id,
      ...omit(unusualType, ['_id']),
    }
    : {
      ...changedFields.unusualItem,
      unusualTypeId: null,
      unusualTypeCode: '',
      unusualTypeName: '',
    };

  let newState = finishDraft(changedFields);
  self.setState({
    ...self.state,
    object: {
      ...object,
      ...newState
    }
  });
};

export const onUnusualFieldChange = async (self, data, name, type) => {
  let value;

  switch (type) {
    case 'number':
      value = Number(data) || 0;
      break;
    default:
      value = data || '';
      break;
  }

  const { object } = self.state;
  const changedFields = createDraft(object);

  changedFields.unusualItem = {
    ...changedFields.unusualItem,
    [name]: value,
  };

  let newState = finishDraft(changedFields);
  self.setState({
    ...self.state,
    object: {
      ...object,
      ...newState
    }
  });
};

export const onConfirmReportUnusualItem = async (self) => {
  const { object } = self.state;
  const { _id: objectId, unusualItem } = object;
  const { actualQty, unusualTypeId } = unusualItem;

  if (actualQty === null || actualQty === undefined || actualQty === '' || actualQty < 0) {
    Alert.alert(i18n.t('actualQty'), i18n.t('validateFailure'));

    return;
  }

  if (!unusualTypeId) {
    Alert.alert(i18n.t('reason'), i18n.t('validateFailure'));

    return;
  }

  const clientContext = getApiContextFromSelf(self, object.taskTypeName);
  const postData = {
    _id: objectId,
    unusualList: [unusualItem],
  };

  let { error, data } = await apiPost(`v1/warehouseTasks/reportUnusualItems`, postData, clientContext);

  if (error) {
    Alert.alert(i18n.t('serverError'));

    return;
  }

  self.setState({
    ...self.state,
    object: {
      ...self.state.object,
      ...data.data,
      unusualItemModalVisible: false,
      unusualItem: {},
    }
  })
};

export const onFinishProcess = async (self) => {
  try {
    self.setState(LOADING_STATE);
    const { state } = self;
    const {
      object, pageLoad, staffListSelected,
    } = state;

    const changedFields = createDraft(object);

    if (!staffListSelected || !staffListSelected.length) {
      self.setState({
        ...self.state,
        loading: false,
        error: true,
        messages: `${i18n.t('staff')}: ${i18n.t('isRequired')}`,
      });
      return;
    }

    if (staffListSelected && staffListSelected.length) {
      const uniqueStaffListSelected = Array.from(new Set(staffListSelected));
      const staffOptions = pageLoad[`staffList.staffId`].data;
      let newStaffList = [];

      uniqueStaffListSelected.map(staffSelectedValue => {
        const staffSelectedItem = staffOptions.find(f => equalToId(f._id, staffSelectedValue));
        if (staffSelectedItem) {
          newStaffList.push({
            staffId: staffSelectedItem._id,
            staffUserName: staffSelectedItem.userName,
            staffFullName: staffSelectedItem.fullName
          })
        }
      })

      changedFields.staffList = newStaffList;
    }

    let newState = finishDraft(changedFields);
    const clientContext = getApiContextFromSelf(self, newState.taskTypeName);

    let {
      tmpOutputTaskTabList,
      currentTaskIndex, isFirstTask,
      stagingLocatorId,
      ngProductList, okProductList,
      ngLocatorId, okLocatorId,
      receivingList, putAwayList,
      pickingLocatorId, pickingList,
      packingLocatorId, packingList,
      shippingLocatorId, shippingList, vehicleList,
      scannedList, productList,
      taskIndex, taskList,
    } = newState;

    let isValid = true;

    tmpOutputTaskTabList.forEach(({ taskTab }) => {
      const flatFieldList = self[`${taskTab}_flatFieldList`];
      if (flatFieldList) {
        const validFields = flatFieldList.every(({ fieldName, alt, isRequired, type }) => {
          if (isRequired) {
            let tempFieldName = type === DATA_TYPE.ID ? `${fieldName}Id` : fieldName;

            if (!object[tempFieldName] || object[tempFieldName].toString().trim() === '') {
              if (isValid) {
                self.setState({
                  ...self.state,
                  error: true,
                  success: false,
                  messages: `${i18n.t(alt || fieldName)}: ${i18n.t('isRequired')}`,
                });
              }
              isValid = false;
              return false;
            }
          }
          return true;
        });

        if (!validFields) {
          isValid = false;
        }
      }
    });

    if (!isValid) {
      return;
    }

    let outputTaskTabList = cloneDeep(newState.outputTaskTabList);
    let curTaskTab = outputTaskTabList[currentTaskIndex];
    let preTaskTab = outputTaskTabList[currentTaskIndex - 1];
    let curTaskTabName = curTaskTab ? curTaskTab.taskTab : '';
    let preTaskTabName = preTaskTab ? preTaskTab.taskTab : '';

    if (!preTaskTabName) {
      const preTask = taskList[taskIndex - 1];
      const preTaskOutputTaskTabList = preTask ? preTask.outputTaskTabList : [];
      const lastTaskTabOfPreTask = preTaskOutputTaskTabList[preTaskOutputTaskTabList.length - 1];
      preTaskTabName = lastTaskTabOfPreTask ? lastTaskTabOfPreTask.taskTab : '';
    }

    const preProductList = [];
    const preProductListName = getProductListByTaskTab(preTaskTabName);

    if (isString(preProductListName)) {
      preProductList.push(...newState[preProductListName]);
    }

    if (isArray(preProductListName)) {
      preProductList.push(
        ...newState[preProductListName[0]],
        ...newState[preProductListName[1]],
      );
    }

    const errorList = [];

    if (curTaskTabName === TASK_TAB_LIST.RECEIVING) {

      if (!receivingList.length) {
        self.setState({
          ...self.state,
          loading: false,
          error: true,
          messages: `${i18n.t('receivingList')}: ${i18n.t('isRequired')}`,
        });

        return;
      }

      for (let i = 0; i < receivingList.length; i++) {
        const { packingUnitId } = receivingList[i];
        if (!packingUnitId) {
          errorList.push({
            name: `[${i18n.t('receivingList')}].[${i + 1}].[${i18n.t('packingUnitId')}]`,
            message: 'packingUnitNotCreateErr',
          });
        }
      }

      const productListGrouped = _.groupBy(productList, (item) => `${item.productCode}_${item.lotNo}`);
      const packingUnitListGrouped = _.groupBy(receivingList, (item) => `${item.productCode}_${item.lotNo}`);
      Object.entries(productListGrouped).map(([key, group], index) => {
        const receivingGroup = packingUnitListGrouped[key];
        const receivingQty = _.isUndefined(receivingGroup) ? 0 : receivingGroup.reduce((total, item) => {
          return Number(total) + Number(item.qty || 0);
        }, 0);

        if (receivingQty !== group[0].qty) {
          errorList.push({
            name: `[${i18n.t('receivingList')}]`,
            message: `${i18n.t('validatePickingQty', { productCode: group[0].productCode })}`,
          });
        }
      })

      if (errorList.length) {
        self.setState({
          ...self.state,
          loading: false,
          error: true,
          messages: errorList,
        });

        return;
      }

      for (const receivingItem of receivingList) {
        const { isSerialized, qty, packingUnitCode, productCode, lotNo } = receivingItem;

        if (isSerialized) {
          const newScannedList = scannedList.map((scannedItem, index) => ({
            ...scannedItem,
            index: index
          }));

          const productListByPackingUnit = newScannedList.filter(s => isEqual(s.packingUnitCode, packingUnitCode));
          const scannedQty = productListByPackingUnit.length;
          // console.log(qty, "=======", productListByPackingUnit.length)

          if (!isEqual(Number(qty), scannedQty)) {
            errorList.push({
              name: i18n.t('scannedList'),
              message: i18n.t('validateScanQty', { productCode, scannedQty, qty }),
            });
          }

          productListByPackingUnit.forEach((product) => {
            const { index, serialNo: serialNoItem, packingUnitCode: packingUnitItemCode, productCode: productItemCode, lotNo: lotNoItem } = product;
            if (serialNoItem.toString().trim() === '') {
              errorList.push({
                name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('serialNo')}]`,
                message: i18n.t('msg.validate.isRequired'),
              });
            }

            if (!isEqual(packingUnitCode, packingUnitItemCode)) {
              errorList.push({
                name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('packingUnitId')}]`,
                message: i18n.t('msg.validate.failure'),
              });
            }

            if (!isEqual(productCode, productItemCode)) {
              errorList.push({
                name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('productCode')}]`,
                message: i18n.t('msg.validate.failure'),
              });
            }

            if (!isEqual(lotNo, lotNoItem)) {
              errorList.push({
                name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('lotNo')}]`,
                message: i18n.t('validateScanLotNo'),
              });
            }
          });
        }
      }
    }

    if (curTaskTabName === TASK_TAB_LIST.INSPECTION) {
      if (isFirstTask && !stagingLocatorId) {
        errorList.push({
          name: i18n.t('inspectionPickingLocator'),
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      if (!ngProductList.length && !okProductList.length) {
        errorList.push({
          name: i18n.t('inspectionResult'),
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      if (ngProductList.length && !ngLocatorId) {
        errorList.push({
          name: i18n.t('ngLocatorId'),
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      if (okProductList.length && !okLocatorId) {
        errorList.push({
          name: i18n.t('okLocatorId'),
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      const tmpInspectionList = [...ngProductList, ...okProductList];
      const totalQtyByOriginLineId = tmpInspectionList.reduce((acc, item) => {
        const { originLineId, qty } = item;
        if (acc[originLineId]) {
          acc[originLineId] += Number(qty);
        } else {
          acc[originLineId] = Number(qty);
        }
        return acc;
      }, {});

      const totalQtyArray = Object.entries(totalQtyByOriginLineId).map(([originLineId, totalQty]) => ({
        originLineId,
        totalQty,
      }));

      for (const preProduct of preProductList) {
        const { _id: originLineId } = preProduct;
        const totalQty = totalQtyArray.find(item => item.originLineId === originLineId);

        if (totalQty && Number(totalQty.totalQty) !== Number(preProduct.qty)) {
          errorList.push({
            name: i18n.t('inspectionResult'),
            message: `${i18n.t('validateInspectionQty', {
              productCode: preProduct.productCode,
              inputQty: totalQty.totalQty,
              totalQty: preProduct.qty
            })}`,
          });
        }
      }
    }

    if (curTaskTabName === TASK_TAB_LIST.PUT_AWAY) {
      if (!putAwayList.length) {
        errorList.push({
          name: i18n.t('putAwayList'),
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      const duplicateOriginLineIds = putAwayList
        .reduce((acc, item) => {
          acc[item.originLineId] = (acc[item.originLineId] || 0) + 1;
          return acc;
        }, {});

      const originLineIdsWithDuplicates = Object.keys(duplicateOriginLineIds)
        .filter(key => duplicateOriginLineIds[key] > 1);

      const packingUnitCodesWithDuplicates = putAwayList
        .filter(item => originLineIdsWithDuplicates.includes(item.originLineId))
        .map(item => item.packingUnitCode);

      const packingUnitCodes = [...new Set(packingUnitCodesWithDuplicates)];

      if (packingUnitCodes && packingUnitCodes.length) {
        const uniquePackingUnitCodes = packingUnitCodes.join(', ');
        errorList.push({
          name: 'putAwayList',
          message: i18n.t('duplicatePackingUnitToPutAway', { uniquePackingUnitCodes }),
        });
      }

      const productListGrouped = _.groupBy(productList, (item) => `${item.productCode}_${item.lotNo}`);
      const putAwayListGrouped = _.groupBy(putAwayList, (item) => `${item.productCode}_${item.lotNo}`);
      Object.entries(productListGrouped).map(([key, group], index) => {
        const putAwayGroup = putAwayListGrouped[key];
        const putAwayQty = _.isUndefined(putAwayGroup) ? 0 : putAwayGroup.reduce((total, item) => {
          return Number(total) + Number(item.qty || 0);
        }, 0);

        if (putAwayQty !== group[0].qty) {
          errorList.push({
            name: `[${i18n.t('putAwayList')}]`,
            message: `${i18n.t('validatePickingQty', { productCode: group[0].productCode })}`,
          });
        }
      })

      if (errorList.length) {
        self.setState({
          ...self.state,
          loading: false,
          error: true,
          messages: errorList,
        });

        return;
      }
    }

    if (curTaskTabName === TASK_TAB_LIST.PICKING) {
      if (!pickingLocatorId) {
        errorList.push({
          name: i18n.t('outboundStagingLocator'),
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      if (!pickingList.length) {
        errorList.push({
          name: i18n.t('pickingList'),
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      const totalPickedQty = pickingList.reduce((acc, item) => {
        const { productCode, qty } = item;
        if (acc[productCode]) {
          acc[productCode] += Number(qty);
        } else {
          acc[productCode] = Number(qty);
        }
        return acc;
      }, {});

      const totalPickedQtyArray = Object.entries(totalPickedQty).map(([productCode, totalPickedQty]) => ({
        productCode,
        totalPickedQty,
      }));

      const totalRequestedQty = productList.reduce((acc, item) => {
        const { productCode, qty } = item;
        if (acc[productCode]) {
          acc[productCode] += Number(qty);
        } else {
          acc[productCode] = Number(qty);
        }
        return acc;
      }, {});

      const totalRequestedQtyArray = Object.entries(totalRequestedQty).map(([productCode, totalRequestedQty]) => ({
        productCode,
        totalRequestedQty,
      }));

      for (const product of totalRequestedQtyArray) {
        const { productCode, totalRequestedQty } = product;
        const picked = totalPickedQtyArray.find(item => item.productCode === productCode);
        if (!picked || (picked && Number(picked.totalPickedQty) !== Number(totalRequestedQty))) {
          errorList.push({
            name: i18n.t('pickingList'),
            message: `${i18n.t('validatePickingQty', { productCode })}`,
          });
        }
      }

      // for (const product of productList) {
      //   const { _id: originLineId, productCode } = product;
      //   const picked = totalPickedQtyArray.find(item => String(item.originLineId) === String(originLineId));

      //   if (!picked || (picked && Number(picked.totalPickedQty) !== Number(product.qty))) {
      //     errorList.push({
      //       name: i18n.t('pickingList'),
      //       message: `${i18n.t('validatePickingQty', { productCode })}`,
      //     });
      //   }
      // }

      for (const [index, pickingItem] of pickingList.entries()) {
        const {
          isSerialized, qty, packingUnitCode,
          productCode, lotNo, actualInventory,
        } = pickingItem;

        const isExited = pickingList.find((item, i) =>
          i !== index &&
          String(item.packingUnitCode) === String(pickingItem.packingUnitCode) &&
          String(item.productCode) === String(pickingItem.productCode) &&
          String(item.lotNo) === String(pickingItem.lotNo)
        );

        if (isExited) {
          errorList.push({
            name: `[${i18n.t('pickingList')}].[${index + 1}].[${i18n.t('packingUnitId')}].[${packingUnitCode}]`,
            message: i18n.t('msg.validate.isDuplicated'),
          });
        }

        if (!qty || Number(qty) === 0) {
          errorList.push({
            name: `[${i18n.t('pickingList')}].[${index + 1}].[${i18n.t('qty')}]`,
            message: i18n.t('msg.validate.failure'),
          });
        }

        if (!actualInventory || Number(actualInventory) === 0 || Number(actualInventory) < Number(qty)) {
          errorList.push({
            name: `[${i18n.t('pickingList')}].[${index + 1}].[${i18n.t('productId')}]`,
            message: i18n.t('notEnoughStockForSoError', { qty, stockQty: actualInventory }),
          });
        }

        if (isSerialized) {
          const productListByPackingUnit = scannedList.filter(s => isEqual(s.packingUnitCode, packingUnitCode));
          const scannedQty = productListByPackingUnit.length;

          if (!isEqual(Number(qty), scannedQty)) {
            errorList.push({
              name: i18n.t('scannedList'),
              message: i18n.t('validateScanQty', { productCode, scannedQty, qty }),
            });
          }

          productListByPackingUnit.forEach((product, index) => {
            const { serialNo: serialNoItem, packingUnitCode: packingUnitItemCode, productCode: productItemCode, lotNo: lotNoItem } = product;
            if (serialNoItem.toString().trim() === '') {
              errorList.push({
                name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('serialNo')}]`,
                message: i18n.t('msg.validate.isRequired'),
              });
            }

            if (!isEqual(packingUnitCode, packingUnitItemCode)) {
              errorList.push({
                name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('packingUnitId')}]`,
                message: i18n.t('msg.validate.failure'),
              });
            }

            if (!isEqual(productCode, productItemCode)) {
              errorList.push({
                name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('productCode')}]`,
                message: i18n.t('msg.validate.failure'),
              });
            }

            if (!isEqual(lotNo, lotNoItem)) {
              errorList.push({
                name: `[${i18n.t('scannedList')}].[${index + 1}].[${i18n.t('lotNo')}]`,
                message: i18n.t('validateScanLotNo'),
              });
            }
          });
        }
      }
    }

    if (curTaskTabName === TASK_TAB_LIST.PACKING) {
      const countProductListQty = object.productList.reduce((currentValue, p) => Number(p.qty) + currentValue, 0)
      const countPackingListQty = object.packingList.reduce((currentValue, p) => Number(p.qty) + currentValue, 0)

      if (countProductListQty > countPackingListQty) {
        self.setState({
          ...self.state,
          loading: false,
          error: true,
          messages: `${i18n.t('inputAndRequestMustBeEqual')}`,
        });
        return;
      }

      if (countProductListQty < countPackingListQty) {
        self.setState({
          ...self.state,
          loading: false,
          error: true,
          messages: `${i18n.t('insufficientPackagingQuantity')}`,
        });
        return;
      }

      if (!packingLocatorId) {
        self.setState({
          ...self.state,
          loading: false,
          error: true,
          messages: `${i18n.t('packingLocator')}: ${i18n.t('isRequired')}`,
        });

        return;
      }

      if (!packingList.length) {
        self.setState({
          ...self.state,
          loading: false,
          error: true,
          messages: `${i18n.t('packingList')}: ${i18n.t('isRequired')}`,
        });
        return;
      }

      for (let i = 0; i < packingList.length; i++) {
        const { newPackingUnitId } = packingList[i];
        if (!newPackingUnitId) {
          errorList.push({
            name: `[${i18n.t('packingList')}].[${i + 1}].[${i18n.t('newPackingUnitId')}]`,
            message: 'packingUnitNotCreateErr',
          });
        }
      }

      const totalQtyByOriginLineId = packingList.reduce((acc, item) => {
        const { originLineId, qty } = item;
        if (acc[originLineId]) {
          acc[originLineId] += Number(qty);
        } else {
          acc[originLineId] = Number(qty);
        }
        return acc;
      }, {});

      const totalPacking = Object.entries(totalQtyByOriginLineId).map(([originLineId, totalQty]) => ({
        originLineId,
        totalQty,
      }));

      // for (const preProduct of preProductList) {
      //   const { _id: originLineId } = preProduct;
      //   const packed = totalPacking.find(item => String(item.originLineId) === String(originLineId));

      //   if (!packed || (packed && Number(packed.totalQty) !== Number(preProduct.qty))) {
      //     errorList.push({
      //       name: 'packingList',
      //       message: `${i18n.t('validatePackingQty', {
      //         productCode: preProduct.productCode,
      //         packingQty: totalQty.totalQty || 0,
      //         totalQty: preProduct.qty
      //       })}`,
      //     });
      //   }
      // }
    }

    if (curTaskTabName === TASK_TAB_LIST.SHIPPING) {
      if (!shippingLocatorId) {
        errorList.push({
          name: 'shippingLocatorId',
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      if (!shippingList.length) {
        errorList.push({
          name: 'shippingList',
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      if (!vehicleList.length) {
        errorList.push({
          name: 'vehicleList',
          message: i18n.t('msg.validate.isRequired'),
        });
      }

      const filteredProducts = await Promise.all(
        object.shippingList.map(async (item) => {
          const { data: { data: packingUnit } } = await apiGetById(
            'v1/packingUnits',
            item.packingUnitId,
            ['_id', 'storeLocatorId'],
            false,
            clientContext
          );

          const { data: { data: storeLocator } } = await apiGetById(
            'v1/storeLocators',
            packingUnit.storeLocatorId,
            ['productList'],
            false,
            clientContext

          );

          const isLocked = storeLocator.productList.some(
            (product) => product.productId === item.productId && product.locked === true
          );

          return isLocked ? { ...item, locked: true } : { ...item, locked: false };
        })
      );

      filteredProducts.map((item) => {
        if (item?.locked) {
          errorList.push({
            name: 'shippingList',
            message: `${i18n.t('product')} ${item.productCode} ${i18n.t('locked')}`,
          })
        }
      })
    }

    if (errorList.length) {
      self.setState({
        ...self.state,
        loading: false,
        error: true,
        messages: errorList,
      });

      return;
    }

    if (outputTaskTabList[currentTaskIndex].state) {
      outputTaskTabList[currentTaskIndex].state = TASK_STATE.FINISHED;
    }

    let newObject = cloneDeep(newState);

    if (curTaskTabName === TASK_TAB_LIST.PICKING) {
      const packingUnitIdList = _.uniqBy(pickingList, "packingUnitId").map((item) => String(item.packingUnitId));

      let { error: errorPu, data: resultPu } = await apiGetList(
        'v1/packingUnits',
        {
          packingUnitId: { $in: packingUnitIdList },
          fields: 'productAll'
        },
        clientContext
      );

      if (errorPu) {
        Alert.alert(i18n.t('serverError'));

        return;
      }

      const packingUnitList = resultPu.data;

      const totalQtyByProductAndPu = pickingList.reduce((acc, item) => {
        const key = `${item.productId}-${item.packingUnitId}`;
        acc[key] = (acc[key] || 0) + Number(item.qty);
        return acc;
      }, {});

      const allPickedPuList = Object.entries(totalQtyByProductAndPu).map(
        ([key, totalQty]) => {
          const [productId, packingUnitId] = key.split("-");
          return { productId, packingUnitId, totalQty };
        }
      );

      const createNewPuList = [];

      for (const pu of packingUnitList) {
        const { _id: packingUnitId, productAll } = pu;

        const totalQtyByProduct = productAll.reduce((acc, item) => {
          const key = item.productId;
          acc[key] = (acc[key] || 0) + Number(item.qty);
          return acc;
        }, {});

        const totalQtyByProductList = Object.entries(totalQtyByProduct).map(
          ([key, totalQty]) => {
            return { productId: key, totalQty };
          }
        );

        const pickedPuList = allPickedPuList.filter(
          (item) => String(item.packingUnitId) === String(packingUnitId)
        );

        if (pickedPuList.length !== totalQtyByProductList.length) {
          createNewPuList.push(packingUnitId);
        }

        if (pickedPuList.length === totalQtyByProductList.length) {
          for (const product of totalQtyByProductList) {
            const pickedProduct = pickedPuList.find(
              (item) => String(item.productId) === String(product.productId)
            );

            if (
              (!pickedProduct ||
                Number(pickedProduct.totalQty) !== Number(product.totalQty)) &&
              !createNewPuList.includes(packingUnitId)
            ) {
              createNewPuList.push(packingUnitId);
            }
          }
        }
      }

      const {
        companyId, companyCode, companyName,
        departmentId, departmentCode, departmentName,
        warehouseId, warehouseCode, warehouseName,

        pickingLocatorId, pickingLocatorCode, pickingLocatorName,
        pickingLocatorTypeId, pickingLocatorTypeCode, pickingLocatorTypeName,
        pickingStoreSectionId, pickingStoreSectionCode, pickingStoreSectionName,
        pickingStoreId, pickingStoreCode, pickingStoreName,
        pickingStoreTypeId, pickingStoreTypeCode, pickingStoreTypeName,

        customerId, customerCode, customerName,
        customerGroupId, customerGroupCode, customerGroupName,
        address, email,

        _id: taskId, taskCode, serviceOrderCode,
      } = newState;

      let newPickingList = cloneDeep(pickingList);
      let newPackingUnitList = [];

      const groupByPu = _(pickingList)
        .groupBy(i => i.packingUnitId)
        .map((value, key) => (value))
        .value();

      for (let group of groupByPu) {
        const {
          packingUnitId, packingUnitCode,
          packingUnitTypeId, packingUnitTypeCode, packingUnitTypeName,
          puTypeWidth, puTypeDepth, puTypeHeight,
          puTypeMaxWeight, puTypeVolume,
        } = group[0];

        ({ error: errorPu, data: resultPu } = await apiGetList(
          'v1/packingUnits',
          {
            packingUnitCode: { $regex: packingUnitCode, $options: "i" },
            fields: 'packingUnitCode',
            sortBy: 'createdAt.desc',
          },
          clientContext
        ));

        if (errorPu) {
          Alert.alert(i18n.t('serverError'));

          return;
        }

        const descPuList = resultPu.data;
        const { packingUnitCode: finalPackingUnitCode } = descPuList[0];
        const packingUnitCodeSplit = finalPackingUnitCode.split("-");

        if (packingUnitCodeSplit[3]) {
          packingUnitCodeSplit[3] = String(
            parseInt(packingUnitCodeSplit[3], 10) + 1
          ).padStart(2, "0");
        } else {
          packingUnitCodeSplit[3] = "01";
        }

        const updatedCode = packingUnitCodeSplit.join("-");

        if (createNewPuList.includes(packingUnitId)) {
          const puObject = {
            taskId, taskCode, serviceOrderCode,

            companyId, companyCode, companyName,
            departmentId, departmentCode, departmentName,
            warehouseId, warehouseCode, warehouseName,

            customerId, customerCode, customerName,
            customerGroupId, customerGroupCode, customerGroupName,
            address, email,

            storeLocatorId: pickingLocatorId,
            storeLocatorCode: pickingLocatorCode,
            storeLocatorName: pickingLocatorName,

            storeLocatorTypeId: pickingLocatorTypeId,
            storeLocatorTypeCode: pickingLocatorTypeCode,
            storeLocatorTypeName: pickingLocatorTypeName,

            storeSectionId: pickingStoreSectionId,
            storeSectionCode: pickingStoreSectionCode,
            storeSectionName: pickingStoreSectionName,

            storeId: pickingStoreId,
            storeCode: pickingStoreCode,
            storeName: pickingStoreName,

            storeTypeId: pickingStoreTypeId,
            storeTypeCode: pickingStoreTypeCode,
            storeTypeName: pickingStoreTypeName,

            packingUnitCode: updatedCode,
            packingUnitName: updatedCode,
            packingUnitNumber: 1,

            packingUnitTypeId, packingUnitTypeCode, packingUnitTypeName,
            puTypeWidth, puTypeDepth, puTypeHeight,
            puTypeMaxWeight, puTypeVolume,
            productAll: [],
          };

          const productList = [];

          for (let item of group) {
            const {
              productId, productCode, productName, productVolume,
              productSegmentId, productSegmentCode, productSegmentName,
              refDocumentTypeList, productAttributeList,
              uomId, uomCode, uomName,
              lotNo, lotDate, expDate,
              qty,
            } = item;

            productList.push({
              productId, productCode, productName, productVolume,
              productSegmentId, productSegmentCode, productSegmentName,
              refDocumentTypeList, productAttributeList,
              uomId, uomCode, uomName,
              lotNo: lotNo ? lotNo : '', lotDate, expDate,
              qty,
            });
          }

          puObject.productAll = productList;
          const newPackingUnitData = await apiCreate('v1/packingUnits', puObject, clientContext);
          const newPackingUnit = newPackingUnitData.data.data;
          newPackingUnitList.push(newPackingUnit);
        }
      }

      for (const [index, pickingItem] of newPickingList.entries()) {
        const { packingUnitCode } = pickingItem;
        const newPackingUnit = newPackingUnitList.find(item => item.packingUnitCode.includes(packingUnitCode));

        let {
          _id: newPackingUnitId,
          packingUnitCode: newPackingUnitCode,
          packingUnitName: newPackingUnitName,
          packingUnitTypeId, packingUnitTypeCode, packingUnitTypeName,
          puTypeWidth, puTypeDepth, puTypeHeight,
          puTypeMaxWeight, puTypeVolume,
        } = newPackingUnit;

        newPickingList[index].newPackingUnitId = newPackingUnitId;
        newPickingList[index].newPackingUnitCode = newPackingUnitCode;
        newPickingList[index].newPackingUnitName = newPackingUnitName;
        newPickingList[index].newPackingUnitNumber = 1;

        newPickingList[index].newPackingUnitTypeId = packingUnitTypeId;
        newPickingList[index].newPackingUnitTypeCode = packingUnitTypeCode;
        newPickingList[index].newPackingUnitTypeName = packingUnitTypeName;

        newPickingList[index].newPUTypeWidth = puTypeWidth;
        newPickingList[index].newPUTypeDepth = puTypeDepth;
        newPickingList[index].newPUTypeHeight = puTypeHeight;
        newPickingList[index].newPUTypeMaxWeight = puTypeMaxWeight;
        newPickingList[index].newPUTypeVolume = puTypeVolume;
      }

      newObject.pickingList = newPickingList;
    }

    newObject.currentTaskIndex = currentTaskIndex + 1;
    newObject.outputTaskTabList = outputTaskTabList;
    newObject.buttonPress = 'finishProcess';

    if (currentTaskIndex < newObject.outputTaskTabList.length - 1) {
      newObject.outputTaskTabList[currentTaskIndex + 1].state = TASK_STATE.PROCESSING;
    }

    const postData = {
      _id: newObject._id,
      tabName: curTaskTabName,
      object: newObject,
    };

    let { error, data } = await apiPost(`v1/warehouseTasks/finishProcess/${newObject._id}`, postData, clientContext);

    if (error) {
      Alert.alert(i18n.t('serverError'));

      return;
    }

    // self.setState({
    //   ...self.state,
    //   loading: false,
    //   object: {
    //     ...self.state.object,
    //     ...data.data,
    //   }
    // })

    setTimeout(async () => {
      await loadComponentData(self, newObject._id, newObject.taskTypeName);
    }, 2000)

  } catch (error) {
    self.setState({
      loading: false,
      error: true,
      messages: `${i18n.t('msg.update.failure')}`,
    });
  }
}

// export const onConfirmCheckin = async (self) => {
//   const { userId, userName, userFullName } = self.props;
//   console.log("🚀 ~ onConfirmCheckin ~ userFullName:", userFullName)
//   console.log("🚀 ~ onConfirmCheckin ~ userName:", userName)
//   console.log("🚀 ~ onConfirmCheckin ~ userId:", userId)
// }

export const onConfirmCheckin = async (self) => {
  try {
    self.setState(LOADING_STATE);
    const { state } = self;
    const {
      object, pageLoad, staffListSelected,
    } = state;

    const changedFields = createDraft(object);

    if (staffListSelected && staffListSelected.length) {
      const uniqueStaffListSelected = Array.from(new Set(staffListSelected));
      const staffOptions = pageLoad[`staffList.staffId`].data;
      let newStaffList = [];

      uniqueStaffListSelected.map(staffSelectedValue => {
        const staffSelectedItem = staffOptions.find(f => equalToId(f._id, staffSelectedValue));
        if (staffSelectedItem) {
          newStaffList.push({
            staffId: staffSelectedItem._id,
            staffUserName: staffSelectedItem.userName,
            staffFullName: staffSelectedItem.fullName
          })
        }
      })

      changedFields.staffList = newStaffList;
    }

    let newState = finishDraft(changedFields);

    let {
      currentTaskIndex,
      taskIndex, taskList,
    } = newState;

    let outputTaskTabList = cloneDeep(newState.outputTaskTabList);
    let curTaskTab = outputTaskTabList[currentTaskIndex];
    let preTaskTab = outputTaskTabList[currentTaskIndex - 1];
    let curTaskTabName = curTaskTab ? curTaskTab.taskTab : '';
    let preTaskTabName = preTaskTab ? preTaskTab.taskTab : '';

    if (!preTaskTabName) {
      const preTask = taskList[taskIndex - 1];
      const preTaskOutputTaskTabList = preTask ? preTask.outputTaskTabList : [];
      const lastTaskTabOfPreTask = preTaskOutputTaskTabList[preTaskOutputTaskTabList.length - 1];
      preTaskTabName = lastTaskTabOfPreTask ? lastTaskTabOfPreTask.taskTab : '';
    }

    const preProductList = [];
    const preProductListName = getProductListByTaskTab(preTaskTabName);

    if (isString(preProductListName)) {
      preProductList.push(...newState[preProductListName]);
    }

    if (isArray(preProductListName)) {
      preProductList.push(
        ...newState[preProductListName[0]],
        ...newState[preProductListName[1]],
      );
    }

    const errorList = [];

    if (errorList.length) {
      self.setState({
        ...self.state,
        loading: false,
        error: true,
        messages: errorList,
      });

      return;
    }

    if (outputTaskTabList[currentTaskIndex]) {
      outputTaskTabList[currentTaskIndex].state = TASK_STATE.FINISHED;
    }

    let newObject = cloneDeep(newState);

    newObject.currentTaskIndex = currentTaskIndex + 1;
    newObject.outputTaskTabList = outputTaskTabList;
    newObject.buttonPress = 'finishProcess';

    if (currentTaskIndex < newObject.outputTaskTabList.length - 1) {
      newObject.outputTaskTabList[currentTaskIndex + 1].state = TASK_STATE.PROCESSING;
    }
    newObject.warehouseGateCheckinTime = new Date();
    // newObject.handoverUserId = userId;
    // newObject.handoverUserName = userName;
    // newObject.handoverUserFullName = userFullName;
    // newObject.staffList = [...newObject.staffList, { staffId: userId, staffUserName: userName, staffFullName: userFullName }]

    const clientContext = getApiContextFromSelf(self, newState.taskTypeName);
    const postData = {
      _id: newObject._id,
      tabName: curTaskTabName,
      object: newObject,
    };

    let { error, data } = await apiPost(`v1/warehouseTasks/finishProcess/${newObject._id}`, postData, clientContext);

    if (error) {
      Alert.alert(i18n.t('serverError'));
      return;
    }

    self.setState({ isModalVisible: false });

    setTimeout(async () => {
      await loadComponentData(self, newObject._id, newObject.taskTypeName);
    }, 2000)

  } catch (error) {
    self.setState({
      loading: false,
      error: true,
      messages: `${i18n.t('msg.update.failure')}`,
    });
  }
}

export const onCreateLineTable = async (self) => {
  try {
    const newObject = cloneDeep(self.state.object)
    const { vehicleList } = newObject;

    const updatedVehicleList = [{}, ...vehicleList];

    self.setState({
      ...self.state,
      object: {
        ...newObject,
        vehicleList: updatedVehicleList
      }
    });

  } catch (error) {
    self.setState({
      loading: false,
      error: true,
      messages: `${i18n.t('msg.create.failure')}`,
    });
  }
}