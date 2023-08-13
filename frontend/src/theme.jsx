import {createTheme, responsiveFontSizes} from '@mui/material';

const theme = createTheme({
    components: {
        MuiCardContent: {
          styleOverrides: {
            root: {
                '&:last-child': {
                    paddingBottom: '16px',
                  },
            },
          },
        },
      },
});

export default responsiveFontSizes(theme);