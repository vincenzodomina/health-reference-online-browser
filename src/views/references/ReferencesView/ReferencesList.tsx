import React, {
  useState,
  SyntheticEvent,
  Fragment,
  useEffect
} from 'react';
import type {
  FC,
  ChangeEvent
} from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import clsx from 'clsx';
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridRowParams,
  GridSortModel,
  MuiEvent,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarFilterButton
} from '@mui/x-data-grid';
import {
  Box,
  Button,
  Grid,
  Card,
  SvgIcon,
  makeStyles,
  Typography,
  Divider,
  TextField,
  InputAdornment,
  IconButton
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import {
  ArrowRight as ArrowRightIcon,
  Search as SearchIcon
} from 'react-feather';
import LoadingButton from 'src/components/LoadingButton';
import UploadIcon from '@material-ui/icons/CloudUpload';
import DownloadIcon from '@material-ui/icons/GetApp';
import { Theme } from 'src/theme';
import { BiomarkersState } from 'src/slices/biomarkers.slice';
import CustomLoadingOverlay from 'src/components/CustomLoadingOverlay';
import { Biomarker } from 'src/models/biomarker.model';
import { businessLogic } from 'src/config';
import { createBiomarkersService } from 'src/services/biomarker.service';
import { appRoutes } from 'src/route-paths';
import { downloadJSONFile } from 'src/utils/downloadJSONFile';
import { biomarkerCategories, biomarkerSettings } from 'src/constants/biomarkerTables';
import useQuery from 'src/hooks/useQuery';
import LoadingScreen from 'src/components/LoadingScreen';

interface BiomarkersListProps {
  className?: string;
  biomarkers: BiomarkersState;
}

interface Filters {
  category?: string;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: '100%',
  },
  datagrid: {
    width: '100%',
    border: "none",
    boxShadow: 'none',
    '& .MuiCheckbox-root.Mui-checked .MuiIconButton-label:after': {
      color: "secondary"
    },
  },
  toolbox: {
    color: theme.palette.text.secondary
  },
  queryField: {
    width: '100%',
    maxWidth: 500
  },
  placeholder: {
    height: 200
  },
  categoryField: {
    flexBasis: 200
  }
}));

const applyFilters = (biomarkersState: BiomarkersState, query: string, filters: Filters): any[] => {
  const proccessedQuery: string = query.trim().toLowerCase().replace("  ", " ");
  return biomarkersState.allIds.filter((biomarkerId) => {
    const biomarker: Biomarker = biomarkersState.byId[biomarkerId];
    let matches = true;

    const queryIncludedInName = biomarker?.name?.toLowerCase().includes(proccessedQuery);
    const queryIncludedInCategory = biomarker?.category?.toLowerCase().includes(proccessedQuery);

    if (query && !(queryIncludedInName || queryIncludedInCategory)) {
      matches = false;
    };

    if (filters.category && biomarker?.category !== filters.category) {
      matches = false;
    };

    return matches;
  });
};

const ReferencesList: FC<BiomarkersListProps> = ({ className, biomarkers, ...rest }) => {
  const classes = useStyles();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const history = useHistory();
  const category = useQuery('category');
  const [afterRender, setAfterRender] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker>();
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [query, setQuery] = useState<string>('');
  const [filters, setFilters] = useState({
    category: null
  });


  const exportFileName: string = `${businessLogic.default_source_name}_Biomarkers_Export_${new Date().toISOString()}`;
  const editBiomarkerLink = (id: string): string => `${appRoutes.searchEditReferences + id}`;

  const handleSaveBiomarkers = async () => {
    try {
      setIsSubmitting(true);
      let biomarkersObject = {};

      const saveBios = await createBiomarkersService(biomarkersObject)
        .then(res => res)
        .catch(err => { throw new Error(err); });

      enqueueSnackbar(`Biomarkers saved`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(`Error saving Biomarkers: ${error}`, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadBiomarkersAsJSON = (): void => {
    // Export file name
    const exportName: string = `OpenCures_Biomarkers_Reference_Export_${new Date().toISOString()}`;
    // Sort object properties
    const biomarkersArray: Biomarker[] = biomarkers?.allIds.map(bid => {
      const biomarker: Biomarker = biomarkers?.byId[bid];
      const sortedBiomarker: Biomarker = Object.keys(biomarker).sort().reduce(function (acc, key) {
        acc[key] = biomarker[key];
        return acc;
      }, {} as Biomarker);
      return sortedBiomarker;
    });
    // Remove duplicates
    let newMergedObject: Record<string, Biomarker> = {};
    biomarkersArray.map(int => newMergedObject[int.id] = { ...(newMergedObject[int.id] || {}), ...int });
    // Sort alphabetically
    let newMergedArray: Biomarker[] = Object.keys(newMergedObject).map(bid => newMergedObject[bid]).sort((a, b) => a.id.localeCompare(b.id));
    // Download JSON file
    downloadJSONFile(exportName, newMergedArray);
  };

  useEffect(() => {
    setTimeout(() => {
      setAfterRender(true);
    }, 10000);
  }, []);

  useEffect(() => {
    if (biomarkers?.allIds?.length) {
      setAfterRender(true);
    }
  });

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
    event.persist();
    setQuery(event.target.value);
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLInputElement>): void => {
    event.persist();

    let value = null;

    if (event.target.value !== 'all') {
      value = event.target.value;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      category: value
    }));

    history.push(`${appRoutes.searchReferences}` + (value ? `?category=${value}` : ''));
  };

  useEffect(() => {
    if (category !== filters.category) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        category: category
      }));
    }
  }, [category]);

  const handleClickDeleteInput = () => {
    setQuery('');
  };

  const handleMouseDownInput = (event) => {
    event.preventDefault();
  };

  // Usually query is done on backend with indexing solutions
  const filteredBiomarkers = applyFilters(biomarkers, query, filters);

  const rows: GridRowsProp = afterRender && filteredBiomarkers?.length ? filteredBiomarkers?.map((bid, index) => {
    const biomarker: Biomarker = biomarkers.byId[bid];
    let biomarkerFlat = { ...biomarker, ...(biomarkerSettings[biomarker?.id]?.input_settings ? biomarkerSettings[biomarker?.id].input_settings : {}) };
    return biomarkerFlat;
  }) : [];

  const cellText = (value: any) => {
    return (
      <Typography
        variant="body2"
        color="textPrimary"
      >
        {`${value || ''}`}
      </Typography>
    )
  };

  const handleRowClick = (params: GridRowParams, event: MuiEvent<SyntheticEvent<Element, Event>>, details?: any): void => {
    history.push(editBiomarkerLink(params?.row?.id))
  };

  const columns: GridColDef[] = [
    { field: 'category', headerName: 'Category', width: 135, renderCell: (params) => cellText(params.value) },
    { field: 'id', headerName: 'ID', width: 200, renderCell: (params) => cellText(params.value) },
    { field: 'type', headerName: 'Type', width: 200, renderCell: (params) => cellText(params.value), hide: true },
    { field: 'subtype', headerName: 'Subtype', width: 200, renderCell: (params) => cellText(params.value), hide: true },
    { field: 'classification', headerName: 'Classification', width: 200, renderCell: (params) => cellText(params.value), hide: true },
    { field: 'abbreviated_name', headerName: 'Abbr. Name', width: 200, renderCell: (params) => cellText(params.value), hide: true },
    { field: 'name', headerName: 'Name', width: 250, renderCell: (params) => cellText(params.value) },
    { field: 'default_unit_id', headerName: 'Unit', width: 140, renderCell: (params) => cellText(params.value) },
    { field: 'value_type', headerName: 'Value type', width: 150, renderCell: (params) => cellText(params.value) },
    { field: 'default_value', headerName: 'Default value', width: 140, renderCell: (params) => cellText(params.value) },
    { field: 'description', headerName: 'Description', width: 600, renderCell: (params) => cellText(params.value) },
    { field: 'references', headerName: 'References', width: 600, renderCell: (params) => cellText(params.value) },
  ];

  const sortModel: GridSortModel = [
    {
      field: 'category',
      sort: 'asc',
    },
    {
      field: 'id',
      sort: 'asc',
    },
  ];

  return (
    <Grid
      className={clsx(classes.root, className)}
      container
      spacing={3}
      {...rest}
    >
      <Grid
        item
        xs={12}
        md={12}
        lg={12}
      >
        <Box
          flexGrow={1}
          p={1.5}
          mb={6}
        >
          <Card>

            <Box p={2}>
              <Box
                display="flex"
                alignItems="center"
              >
                <Box
                  flexGrow={1}
                >
                  <TextField
                    className={classes.queryField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SvgIcon
                            fontSize="small"
                            color="action"
                          >
                            <SearchIcon />
                          </SvgIcon>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end" >
                          <IconButton
                            aria-label="clear search"
                            onClick={handleClickDeleteInput}
                            onMouseDown={handleMouseDownInput}
                            edge="end"
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    onChange={handleQueryChange}
                    placeholder="Search Biomarkers"
                    value={query}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                {/* <Box pl={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.showCreatedByMe}
                  onChange={handleFilterCreatedByMe}
                  size="small"
                />
              }
              label={
                <Typography
                  color="textSecondary"
                  variant="caption"
                >
                  {"Show Users created by me"}
                </Typography>
              }
            />
          </Box> */}

              </Box>

              <Box
                mt={3}
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
              >
                <TextField
                  className={classes.categoryField}
                  label="Category"
                  name="category"
                  onChange={handleCategoryChange}
                  select
                  SelectProps={{ native: true }}
                  value={filters.category || 'all'}
                  variant="outlined"
                  size="small"
                >
                  {biomarkerCategories.map((categoryOption) => (
                    <option
                      key={categoryOption.id}
                      value={categoryOption.id}
                    >
                      {categoryOption.name}
                    </option>
                  ))}
                </TextField>
              </Box>

            </Box>
            <Divider />
            <Box
              display="flex"
              flex={1}
              flexDirection="row"
            >
              <Box
                display="flex"
                flexDirection="column"
                flexGrow={1}
                flex={1}
                minWidth={0}
                minHeight={selectedBiomarker ? undefined : 520}
                style={selectedBiomarker ? { borderRight: "1px solid", borderColor: "rgba(0,0,0,.1)" } : {}}
              >
                {selectedRowIds.length ?
                  <Box
                    display="flex"
                    alignItems="center"
                    mt={2}
                    mb={2}
                  >
                    <Box
                      ml={2}
                    >
                      <LoadingButton
                        //color="inherit"
                        variant="contained"
                        //onClick={handleDeleteBiomarker}
                        isSubmitting={isDeleting}
                        disabled={isDeleting}
                        size="small"
                      >
                        Delete
                      </LoadingButton>
                    </Box>
                    <Box
                      ml={2}
                    >
                      <Typography
                        color="textPrimary"
                        variant="caption"
                      >
                        {`Selected Biomarkers: ${selectedRowIds.length}`}
                      </Typography>
                    </Box>
                    <Box flexGrow={1} />
                  </Box>
                  : null}


                <DataGrid
                  autoHeight
                  autoPageSize
                  density="compact"
                  checkboxSelection
                  //loading
                  rows={rows}
                  columns={columns}
                  sortModel={sortModel}
                  onRowClick={handleRowClick}
                  className={classes.datagrid}
                  //scrollbarSize={10}
                  //isRowSelectable=
                  components={{
                    Toolbar: () => (
                      <GridToolbarContainer style={{ marginLeft: 8, marginBottom: 8, minWidth: 300 }}>
                        <GridToolbarColumnsButton className={classes.toolbox} />
                        <GridToolbarFilterButton className={classes.toolbox} />
                        <GridToolbarExport csvOptions={{ fileName: exportFileName }} className={classes.toolbox} />
                      </GridToolbarContainer>
                    ),
                    //   NoRowsOverlay: () => (
                    //     <Box
                    //       display="flex"
                    //       justifyContent="center"
                    //       alignItems="center"
                    //       className={classes.placeholder}
                    //     >
                    //       <Typography
                    //         variant="body2"
                    //         color="textSecondary"
                    //         align="center"
                    //       >
                    //         {'No Rows'}
                    //       </Typography>
                    //     </Box>
                    //   ),
                    // Checkbox: () => (
                    //   <Checkbox color="secondary" />
                    // ),
                    LoadingOverlay: CustomLoadingOverlay,
                  }}
                />

                <Box
                  display="flex"
                  alignItems="center"
                  p={2}
                >
                  <Box flexGrow={1} />
                  <LoadingButton
                    color="secondary"
                    variant="outlined"
                    onClick={handleDownloadBiomarkersAsJSON}
                    isSubmitting={isSubmitting}
                    disabled={isSubmitting}
                    startIcon={<DownloadIcon />}
                  >
                    Download as JSON
                  </LoadingButton>
                </Box>



                {!afterRender ?
                  <LoadingScreen />
                  : null
                }

              </Box>


            </Box>

          </Card>
        </Box>
      </Grid>
    </Grid>
  );
};

ReferencesList.propTypes = {
  className: PropTypes.string,
  // @ts-ignore
  biomarkers: PropTypes.object
};

ReferencesList.defaultProps = {
};

export default ReferencesList;
