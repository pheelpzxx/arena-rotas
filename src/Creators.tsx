import {Box,Paper,Stack,Typography} from '@mui/material';
const phellipePhoto=new URL('./assets/phellipe.png',import.meta.url).href;
const gustavoPhoto=new URL('./assets/gustavo.png',import.meta.url).href;

export default function Creators(){
  return <Paper component="footer" sx={{mt:5,p:{xs:2.5,md:3},borderTop:'3px solid #cf1d2a'}}>
    <Stack direction={{xs:'column',md:'row'}} gap={3} alignItems={{xs:'flex-start',md:'center'}} justifyContent="space-between">
      <Box><Typography fontSize={11} fontWeight={800} color="primary" letterSpacing={1.6}>FEITO PARA A EXPEDIÇÃO</Typography><Typography variant="h6" mt={.5}>Criadores do sistema</Typography><Typography color="text.secondary" fontSize={13} mt={.5}>Phellipe e Gustavo · Arena Central de Rotas</Typography></Box>
      <Stack direction={{xs:'column',sm:'row'}} gap={{xs:2,sm:4}}>
        {[{name:'Phellipe',photo:phellipePhoto,crop:{backgroundSize:'205%',backgroundPosition:'76% 57%'}},{name:'Gustavo',photo:gustavoPhoto,crop:{backgroundSize:'393%',backgroundPosition:'7.5% 50%'}}].map(person=><Stack key={person.name} direction="row" gap={1.5} alignItems="center">
          <Box role="img" aria-label={`Foto de ${person.name}`} sx={{width:56,height:56,flexShrink:0,borderRadius:'50%',border:'3px solid white',outline:'1px solid #dce3ed',backgroundImage:`url(${person.photo})`,backgroundRepeat:'no-repeat',...person.crop}}/>
          <Box><Typography fontWeight={800}>{person.name}</Typography><Typography fontSize={12} color="text.secondary">Criador do sistema</Typography></Box>
        </Stack>)}
      </Stack>
    </Stack>
    <Typography fontSize={11} color="text.secondary" sx={{mt:2.5,pt:2,borderTop:'1px solid #e1e7ef'}}>ARENA / CENTRAL DE ROTAS · Consulta somente leitura · Alterações de simulação ficam nesta aba</Typography>
  </Paper>;
}
