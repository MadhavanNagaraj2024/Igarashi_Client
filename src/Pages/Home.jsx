import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  FormControl,
  Grid,
  TextField,
  Typography,
  Button,
  Box,
  MenuItem,
  Select,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { MaterialReactTable } from "material-react-table";

let first = false;
let timeslap = null;

export default function Home(props) {
  const { triggerPopup } = props;
  const [loading, setLoading] = useState(false);

  const [machine, setMachine] = useState("");
  const [shift, setShift] = useState("Shift A");
  const [fromDate, setFromDate] = useState("");
  const [columnsdynamic, setcolumnsdynamic] = useState([]);
  const [toDate, setToDate] = useState("");
  const [getSelTemplate, setSelTemplate] = useState("select");
  const [getTemplateSelect, setTemplateSelect] = useState([]);
  const [totalRowCount, setTotalRowCount] = React.useState(0);
  const [data, setdata] = useState([]);
  const [option, setoption] = useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0, // Current page
    pageSize: 10, // Rows per page
  });
  const [filePath, setfilePath] = useState({ file: "" });

  const [shift_time, setShift_time] = useState({
    "Shift A": { from_time: "", to_time: "" },
    "Shift B": { from_time: "", to_time: "" },
    "Shift C": { from_time: "", to_time: "" },
    General: { from_time: "", to_time: "" },
    All: { from_time: "00:00", to_time: "23:59" },
    Custom: { from_time: "", to_time: "" },
  });

  useEffect(() => {
    setMachine("");
    const time = localStorage.getItem("shift_time");
    const date = sessionStorage.getItem("date")?.split("|");
    if (time) {
      setShift_time(JSON.parse(time));
    }
    if (date?.[0] && date?.[1]) {
      setFromDate(date?.[0]);
      setToDate(date?.[1]);
    } else {
      setFromDate(new Date()?.toISOString()?.split("T")?.[0]);
      setToDate(new Date()?.toISOString()?.split("T")?.[0]);
    }
    if (date?.[2]) {
      // setMachine(date?.[2]);
      window.versions
        .gettable_structure({ TABLE_NAME: date?.[2] })
        .then((res) => {
          let new_columns = [];
          for (let index = 0; index < res.length; index++) {
            const element = res[index];
            if (element?.DATA_TYPE === "datetime") {
              new_columns.push({
                header: element?.COLUMN_NAME,
                accessorFn: (row) =>
                  row.Date_Time
                    ? new Date(row.Date_Time)?.toISOString()?.split("T")?.[0]
                    : "",
              });

              new_columns.push({
                accessorKey: "Time",
                header: "Time",
                accessorFn: (row) =>
                  row.Date_Time
                    ? new Date(row.Date_Time)
                        ?.toISOString()
                        ?.split("T")?.[1]
                        ?.split(".")?.[0]
                    : "",
              });
            } else {
              new_columns.push(
                element?.DATA_TYPE === "float"
                  ? {
                      header: element?.COLUMN_NAME,
                      accessorFn: (row) => +row?.[element?.COLUMN_NAME],
                    }
                  : {
                      accessorKey: element?.COLUMN_NAME,
                      header: element?.COLUMN_NAME,
                    }
              );
            }
          }
          // setcolumnsdynamic(new_columns);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);

  const Debounce = useCallback((func = () => {}, delay = 150) => {
    let timer;
    return function (...args) {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }, []);

  const onchangecustomer = async (name, newvalue) => {
    if (!newvalue) return;

    setdata([]);
    setcolumnsdynamic([]);
    setSelTemplate("select");
    setMachine(newvalue?.machinename || "");

    const tableName = machine;

    try {
      const res = await window.versions.editedTemplates(newvalue?.machinename);
      setTemplateSelect(res || []);
    } catch (error) {
      setWindowType("");
      console.log("Error while fetching edit template", error);
    }
  };

  console.log("columnsdynamic", columnsdynamic);

  const fetchingFinalColumn = async (machine, selectedTemplate) => {
    setSelTemplate(selectedTemplate);

    if (selectedTemplate === "No-Template") {
      try {
        window.versions
          .gettable_structure({ TABLE_NAME: machine })
          .then((res) => {
            console.log(res);
            let new_columns = [];

            for (let index = 0; index < res.length; index++) {
              const element = res[index];

              // Skip unwanted column
              if (element?.COLUMN_NAME === "Cycle_Time") continue;

              // Datetime column handling
              if (element?.DATA_TYPE === "datetime") {
                new_columns.push({
                  header: "Date",
                  accessorFn: (row) =>
                    row.Date_Time
                      ? new Date(row.Date_Time).toISOString().split("T")[0]
                      : "",
                });

                new_columns.push({
                  header: "Time",
                  accessorFn: (row) =>
                    row.Date_Time
                      ? new Date(row.Date_Time)
                          .toISOString()
                          .split("T")[1]
                          ?.split(".")[0]
                      : "",
                });
              } else {
                // Float formatting
                if (element?.DATA_TYPE === "float") {
                  new_columns.push({
                    header: element?.COLUMN_NAME,
                    accessorFn: (row) =>
                      row?.[element?.COLUMN_NAME] != null
                        ? Number(row[element.COLUMN_NAME]).toFixed(3)
                        : "",
                  });
                } else {
                  // Default column
                  new_columns.push({
                    accessorKey: element?.COLUMN_NAME,
                    header: element?.COLUMN_NAME,
                  });
                }
              }
            }

            setcolumnsdynamic(new_columns);
          })
          .catch((error) => {
            console.log("getTemplate without color", error);
          });
      } catch (error) {
        console.log("Unexpected error", error);
      }
    } else {
      // -------------------------------------------
      // 1. GET TEMPLATE
      // -------------------------------------------
      const template =
        (await window?.versions?.get_excel_template({
          tableName: machine,
          template: selectedTemplate,
        })) || [];

      console.log("template", template);

      // Convert template array → map for fast access
      const templateMap = {};
      template.forEach((t) => {
        templateMap[t.oldHeader] = t;
      });

      // -------------------------------------------
      // 2. GET TABLE STRUCTURE (columns from DB)
      // -------------------------------------------
      const structure =
        (await window.versions.gettable_structure({
          TABLE_NAME: machine,
        })) || [];

      let finalColumns = [];

      for (let t of template) {
        const colName = t.oldHeader;

        const structureCol = structure.find((s) => s.COLUMN_NAME === colName);

        let columnDef = {};

        // DATE COLUMN
        if (colName.toLowerCase() === "date") {
          columnDef = {
            header: t.newHeader,
            id: t.oldHeader,
            order_no: t.order_no,
            accessorFn: (row) =>
              row.Date_Time
                ? new Date(row.Date_Time).toISOString().split("T")[0]
                : "",
          };
        }

        // TIME COLUMN
        else if (colName.toLowerCase() === "time") {
          columnDef = {
            header: t.newHeader,
            id: t.oldHeader,
            order_no: t.order_no,
            accessorFn: (row) =>
              row.Date_Time
                ? new Date(row.Date_Time)
                    .toISOString()
                    .split("T")[1]
                    .split(".")[0]
                : "",
          };
        } else {
          if (structureCol?.DATA_TYPE === "float") {
            columnDef = {
              header: t.newHeader,
              id: t.oldHeader,
              order_no: t.order_no,
              accessorFn: (row) => +row[colName],
            };
          } else {
            columnDef = {
              header: t.newHeader,
              id: t.oldHeader,
              order_no: t.order_no,
              accessorKey: colName,
            };
          }
        }

        // COLORS
        columnDef.muiTableHeadCellProps = {
          sx: {
            backgroundColor: t.header_bg,
            "& .MuiTypography-root": {
              color: t.header_text,
              fontWeight: "bold",
            },
          },
        };

        columnDef.muiTableBodyCellProps = {
          sx: {
            backgroundColor: t.content_bg,
            color: t.content_text,
          },
        };

        finalColumns.push(columnDef);
      }

      // -------------------------------------------
      // 3. SAVE FINAL DYNAMIC COLUMNS
      // -------------------------------------------

      finalColumns.sort((a, b) => (a.order_no || 9999) - (b.order_no || 9999));

      return setcolumnsdynamic(finalColumns);
    }
  };

  const handleempty = useCallback(() => {
    setoption([]);
  }, []);

  const handlesubmit_pagnation = useCallback(
    Debounce(async () => {
      if (!fromDate) {
        return triggerPopup("select From-Date", "error");
      } else if (!toDate) {
        return triggerPopup("select To-Date", "error");
      } else if (
        !shift_time?.[shift]?.from_time ||
        !shift_time?.[shift]?.to_time
      ) {
        return triggerPopup("select Shift Time", "error");
      } else if (!machine) {
        return triggerPopup("select Machine", "error");
      }
      try {
        let check = Date.now();
        timeslap = check;

        const result = await window.versions.getdata({
          fromDate,
          toDate,
          ...shift_time[shift],
          machine,
          ...pagination,
          getSelTemplate,
        });

        if (check === timeslap) {
          setdata(result?.data);
          setTotalRowCount(result?.data_length || 0);
        } else {
          console.log(timeslap, check, check === timeslap);
        }
      } catch (error) {
        console.log(error);
      }
    }),
    [fromDate, toDate, shift, machine, pagination, shift_time, getSelTemplate]
  );
  const handlesubmit = useCallback(
    async (e, getSelTemplate) => {
      e.target.disabled = true;
      if (!fromDate) {
        e.target.disabled = false;
        return triggerPopup("select From-Date", "warning");
      } else if (!toDate) {
        e.target.disabled = false;
        return triggerPopup("select To-Date", "error");
      } else if (
        !shift_time?.[shift]?.from_time ||
        !shift_time?.[shift]?.to_time
      ) {
        e.target.disabled = false;
        return triggerPopup("select Shift Time", "error");
      } else if (!machine) {
        e.target.disabled = false;
        return triggerPopup("select Machine", "error");
      }

      setLoading(true);
      try {
        window.versions
          .getdata({
            fromDate,
            toDate,
            ...shift_time[shift],
            machine,
            ...pagination,
            getSelTemplate,
          })
          ?.then((result) => {
            setdata(result?.data);
            setTotalRowCount(result?.data_length || 0);
            setLoading(false);
            e.target.disabled = false;
          });
      } catch (error) {
        console.log(error);
        e.target.disabled = false;
      }
    },
    [fromDate, toDate, machine, shift, pagination, getSelTemplate]
  );
  // const data = [
  //     { id: 1, name: "Machine A", status: "Running" },
  //     { id: 2, name: "Machine B", status: "Stopped" },
  // ];
  const handleopenfile = useCallback(() => {
    if (filePath) window?.versions?.openfolder(filePath?.file);
  }, [filePath]);
  const [isLoading, setIsLoading] = useState(false);

  const exportexcel = useCallback(
    async (e, getSelTemplate) => {
      e.target.disabled = true;
      setfilePath(() => ({}));
      if (!fromDate) {
        e.target.disabled = false;
        return triggerPopup("select From-Date", "error");
      } else if (!toDate) {
        e.target.disabled = false;
        return triggerPopup("select To-Date", "error");
      } else if (
        !shift_time?.[shift]?.from_time ||
        !shift_time?.[shift]?.to_time
      ) {
        e.target.disabled = false;
        return triggerPopup("select Shift Time", "error");
      } else if (!machine) {
        e.target.disabled = false;
        return triggerPopup("select Machine", "error");
      }
      setIsLoading(true);

      // if (columnsdynamic.length) {
      //   return triggerPopup("select Template Name", "error");
      // }

      new Promise((resolve, reject) => {
        async function wait() {
          const result = await window.versions.ping({
            fromDate,
            toDate,
            ...shift_time[shift],
            machine,
            getSelTemplate,
          });
          // if(result)

          if (
            result &&
            typeof result === "string" &&
            result.includes("DOWNLOAD")
          ) {
            resolve(result);
          } else {
            reject("Download failed");
          }
          setIsLoading(false);
        }
        wait();
      })
        .then((res) => {
          e.target.disabled = false;
          setfilePath((p) => ({ ...p, file: res }));
        })
        .catch((err) => {
          e.target.disabled = false;
          setfilePath((p) => ({ ...p, file: undefined, error: err }));
        });
    },
    [fromDate, toDate, shift, machine, getSelTemplate]
  );

  useEffect(() => {
    if (first) {
      handlesubmit_pagnation();
    } else {
      first = true;
    }
  }, [pagination]);

  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        "date",
        (fromDate || "") + "|" + (toDate || "") + "|" + (machine || "")
      );
    };
  }, [fromDate, toDate]);

  useEffect(() => {
    return () => {
      timeslap = null;
      first = false;
    };
  }, []);

  //loading button
  const handletimechange = useCallback((shift1, name, value) => {
    setShift_time((p) => {
      const temp = { ...p, [shift1]: { ...p[shift1], [name]: value } };
      localStorage.setItem("shift_time", JSON.stringify(temp));
      return temp;
    });
  }, []);

  return (
    <Card sx={{ p: 3, mx: "auto" }}>
      {/* Title */}
      <Typography
        variant="h4"
        textAlign="center"
        sx={{ pb: 2, fontWeight: "bold" }}
      >
        {machine}
      </Typography>

      {/* Date & Machine Selection */}
      <Grid container spacing={2} columnSpacing={8} alignItems="center">
        {/* From Date */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>From Date</Typography>
          <TextField
            fullWidth
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              if (e.target.value >= toDate) {
                setToDate("");
              }
            }}
          />
        </Grid>

        {/* To Date */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>To Date</Typography>
          <TextField
            fullWidth
            type="date"
            size="small"
            inputProps={{
              min: fromDate,
            }}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </Grid>

        {/* Shift Selection */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>Shift</Typography>
          <FormControl fullWidth>
            <Select
              value={shift}
              size="small"
              onChange={(e) => setShift(e.target.value)}
            >
              {Object.keys(shift_time).map((item, index) => (
                <MenuItem value={item} key={index}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Machine Selection */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>Machine</Typography>

          <FormControl fullWidth>
            <Autocomplete
              freeSolo
              id="machine-autocomplete"
              size="small"
              options={option?.[0] ? option : machine ? [machine] : []}
              value={option?.find((t) => t.machinename === machine) || null}
              getOptionLabel={(option) => option?.TABLE_NAME || ""}
              onOpen={() => {
                window.versions
                  .getactivetable()
                  .then((res) => {
                    setoption(res);
                  })
                  .catch((err) => console.log(err));
              }}
              onBlur={handleempty}
              onChange={(e, newValue) => {
                onchangecustomer("TABLE_NAME", newValue);
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select Machine" />
              )}
            />
          </FormControl>
        </Grid>

        {/* Machine Selection */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>Select Template</Typography>

          <FormControl fullWidth>
            <Select
              size="small"
              value={getSelTemplate}
              onChange={(e) => {
                let selectedTemplate = e.target.value;
                fetchingFinalColumn(machine, selectedTemplate);
              }}
            >
              <MenuItem value="select" disabled>
                Select
              </MenuItem>
              <MenuItem value={"No-Template"}>No Template</MenuItem>
              {getTemplateSelect.map((val) => (
                <MenuItem value={val.template_name}>
                  {val.template_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid
          container
          item
          xs={12}
          sm={6}
          md={4}
          spacing={2}
          alignItems="center"
        >
          <Grid item xs={6}>
            <Typography>From Time</Typography>

            <TextField
              fullWidth
              size="small"
              type={shift === "Custom" ? "time" : "text"}
              onChange={
                shift === "Custom"
                  ? (e) => {
                      handletimechange(shift, "from_time", e.target.value);
                    }
                  : () => {}
              }
              // aria-readonly={true}
              disabled={shift === "Custom" ? false : true}
              value={shift_time?.[shift]?.from_time || ""}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }} // 5 min interval
            />
          </Grid>
          <Grid item xs={6}>
            <Typography>To Time</Typography>

            <TextField
              fullWidth
              size="small"
              type={shift === "Custom" ? "time" : "text"}
              onChange={
                shift === "Custom"
                  ? (e) => handletimechange(shift, "to_time", e.target.value)
                  : () => {}
              }
              // aria-readonly={true}
              disabled={shift === "Custom" ? false : true}
              value={shift_time?.[shift]?.to_time || ""}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }} // 5 min interval
            />
          </Grid>
        </Grid>

        {/* Buttons */}
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          display="flex"
          gap={2}
          justifyContent="flex-end"
        >
          {filePath?.file && (
            <Button variant="contained" onClick={handleopenfile}>
              Show File
            </Button>
          )}
          {filePath?.error && filePath?.error}
          <Button
            variant="contained"
            onClick={(e) => handlesubmit(e, getSelTemplate)}
          >
            Submit
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={(e) => exportexcel(e, getSelTemplate)}
          >
            {isLoading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: "rgba(255,255,255,0.7)", // Semi-transparent white

                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-12px",
                  marginLeft: "-12px",
                }}
              />
            ) : (
              <>Export to Excel</>
            )}
          </Button>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Box mt={3}>
        <MaterialReactTable
          enablePagination
          manualPagination
          rowCount={totalRowCount}
          onPaginationChange={setPagination}
          state={{ pagination, isLoading: loading }}
          muiCircularProgressProps={{ thickness: 4, size: 55 }}
          columns={columnsdynamic}
          enableGlobalFilter={false}
          enableColumnFilters={false}
          data={data}
          enableTopToolbar
          positionActionsColumn="last"
        />
      </Box>
    </Card>
  );
}
