/**
 * Catálogo de registros fotográficos e em vídeo das intervenções em Cartografias.
 * Mantém a ordem inicial pela foto do adesivo/intervenção urbana em cada bloco.
 */
(() => {
  'use strict';

  const namespace = (window.ArtistWebModules = window.ArtistWebModules || {});

  const CARTOGRAPHIES_MEDIA = {
    'messejana-image': {
      title: 'Messejana — Image Tracker',
      subtitle: 'Praça de Messejana',
      items: [
        {
          type: 'image',
          tag: 'Adesivo',
          src: 'assets/cartografias/messejana/image-adesivo.jpg',
          caption: 'Adesivo com ilustração-gatilho e QR Code aplicado em poste na Praça de Messejana.',
          alt: 'Adesivo de Image Tracking com ilustração e QR Code colado em poste na Praça de Messejana',
        },
        {
          type: 'image',
          tag: 'Colagem',
          src: 'assets/cartografias/messejana/image-colagem.jpg',
          caption: 'Registro da colagem do adesivo no entorno da Praça de Messejana.',
          alt: 'Momento da colagem do adesivo de Image Tracking em poste na Praça de Messejana',
        },
        {
          type: 'image',
          tag: 'Resultado',
          src: 'assets/cartografias/messejana/image-resultado.jpg',
          caption: 'Captura em campo da animação em Realidade Aumentada ativada sobre o adesivo.',
          alt: 'Celular apontado para o adesivo de Messejana exibindo a arte em Realidade Aumentada',
        },
        {
          type: 'video',
          tag: 'Vídeo',
          src: 'assets/cartografias/messejana/image-resultado.mp4',
          poster: 'assets/cartografias/messejana/image-resultado-poster.jpg',
          caption: 'Vídeo da intervenção de Image Tracking em funcionamento em Messejana.',
          alt: 'Vídeo da animação em Realidade Aumentada sobre o adesivo em Messejana',
        },
      ],
    },

    'messejana-geo': {
      title: 'Messejana — Geolocalização',
      subtitle: 'Coordenadas -3.831601, -38.497673',
      items: [
        {
          type: 'image',
          tag: 'Informativo',
          src: 'assets/cartografias/messejana/geo-informativo.jpg',
          caption: 'Adesivo informativo com QR Code de acesso à obra geolocalizada em Messejana.',
          alt: 'Adesivo informativo com QR Code e instruções para obra por geolocalização em Messejana',
        },
        {
          type: 'image',
          tag: 'Colagem',
          src: 'assets/cartografias/messejana/geo-colagem.jpg',
          caption: 'Aplicação do adesivo informativo de geolocalização no espaço público em Messejana.',
          alt: 'Registro da colagem do adesivo informativo de geolocalização em Messejana',
        },
        {
          type: 'image',
          tag: 'Resultado',
          src: 'assets/cartografias/messejana/geo-resultado.jpg',
          caption: 'Modelo 3D flutuando na paisagem noturna da Lagoa de Messejana via geolocalização.',
          alt: 'Tela do celular exibindo avião de papel em Realidade Aumentada na Lagoa de Messejana',
        },
      ],
    },

    'benfica-image': {
      title: 'Benfica — Image Tracker',
      subtitle: 'Cruzamento 13 de Maio × Av. da Universidade',
      items: [
        {
          type: 'image',
          tag: 'Adesivo',
          src: 'assets/cartografias/benfica/image-adesivo.jpg',
          caption: 'Adesivo-gatilho aplicado em poste no cruzamento da 13 de Maio com Av. da Universidade.',
          alt: 'Adesivo de Image Tracking com ilustração em laranja e preto e QR Code no Benfica',
        },
        {
          type: 'image',
          tag: 'Resultado',
          src: 'assets/cartografias/benfica/image-resultado.jpg',
          caption: 'Registro fotográfico da experiência em Realidade Aumentada no Benfica.',
          alt: 'Foto do resultado da ativação por Image Tracking no cruzamento 13 de Maio',
        },
        {
          type: 'video',
          tag: 'Vídeo',
          src: 'assets/cartografias/benfica/image-resultado.mp4',
          poster: 'assets/cartografias/benfica/image-resultado-poster.jpg',
          caption: 'Vídeo mostrando a ativação em Realidade Aumentada no Benfica.',
          alt: 'Vídeo da obra por Image Tracking funcionando no Benfica',
        },
      ],
    },

    'benfica-geo': {
      title: 'Benfica — Geolocalização',
      subtitle: 'Av. da Universidade (-3.740955, -38.539123) e IFCE 13 de Maio (-3.744483, -38.536499)',
      items: [
        {
          type: 'image',
          tag: 'Cruzamento · QR',
          src: 'assets/cartografias/benfica/geo-cruzamento-informativo.jpg',
          caption: 'Adesivo informativo da obra 01 no cruzamento da Av. da Universidade com 13 de Maio.',
          alt: 'Adesivo informativo com QR Code aplicado em poste na Av. da Universidade',
        },
        {
          type: 'image',
          tag: 'Reitoria · QR',
          src: 'assets/cartografias/benfica/geo-cruzamento-reitoria.jpg',
          caption: 'Informativo instalado próximo à Reitoria da UFC na Av. da Universidade.',
          alt: 'Adesivo com QR Code em poste em frente à Reitoria da UFC no Benfica',
        },
        {
          type: 'image',
          tag: 'Cruzamento · Resultado',
          src: 'assets/cartografias/benfica/geo-cruzamento-resultado.jpg',
          caption: 'Escultura 3D ancorada por GPS sobre o cruzamento da Av. da Universidade.',
          alt: 'Celular exibindo escultura 3D em Realidade Aumentada no cruzamento da Av. da Universidade',
        },
        {
          type: 'video',
          tag: 'Cruzamento · Vídeo',
          src: 'assets/cartografias/benfica/geo-cruzamento-resultado.mp4',
          poster: 'assets/cartografias/benfica/geo-cruzamento-resultado-poster.jpg',
          caption: 'Vídeo da obra 01 em funcionamento por geolocalização na Av. da Universidade.',
          alt: 'Vídeo da obra geolocalizada em funcionamento na Av. da Universidade',
        },
        {
          type: 'image',
          tag: 'IFCE · Mural',
          src: 'assets/cartografias/benfica/geo-ifce-informativo.jpg',
          caption: 'Adesivo informativo da obra 02 no mural interno do IFCE Campus Fortaleza (13 de Maio).',
          alt: 'Adesivo informativo com QR Code fixado no mural do IFCE Campus Fortaleza',
        },
        {
          type: 'video',
          tag: 'IFCE · Vídeo',
          src: 'assets/cartografias/benfica/geo-ifce-resultado.mp4',
          poster: 'assets/cartografias/benfica/geo-ifce-resultado-poster.jpg',
          caption: 'Vídeo da obra 02 em Realidade Aumentada no pátio do IFCE Campus Fortaleza.',
          alt: 'Vídeo da escultura 3D geolocalizada no pátio do IFCE Campus Fortaleza',
        },
      ],
    },

    'jacarey-image': {
      title: 'Jacarey (Cambeba) — Image Tracker',
      subtitle: 'Lagoa do Jacarey',
      items: [
        {
          type: 'image',
          tag: 'Adesivo',
          src: 'assets/cartografias/jacarey/image-adesivo.jpg',
          caption: 'Adesivo-gatilho com capivara e pássaro aplicado em poste na Lagoa do Jacarey.',
          alt: 'Adesivo ilustrado com capivara e estrela colado em poste na Lagoa do Jacarey',
        },
        {
          type: 'image',
          tag: 'Resultado',
          src: 'assets/cartografias/jacarey/image-resultado.jpg',
          caption: 'Foto da animação em Realidade Aumentada ativada sobre o adesivo no Jacarey.',
          alt: 'Resultado da intervenção de Image Tracking na Lagoa do Jacarey',
        },
        {
          type: 'video',
          tag: 'Vídeo',
          src: 'assets/cartografias/jacarey/image-resultado.mp4',
          poster: 'assets/cartografias/jacarey/image-resultado-poster.jpg',
          caption: 'Vídeo da intervenção de Image Tracking em funcionamento na Lagoa do Jacarey.',
          alt: 'Vídeo mostrando a obra de Image Tracking rodando na Lagoa do Jacarey',
        },
      ],
    },

    'jacarey-geo': {
      title: 'Jacarey (Cambeba) — Geolocalização',
      subtitle: 'Coordenadas -3.800710, -38.490736',
      items: [
        {
          type: 'image',
          tag: 'Informativo',
          src: 'assets/cartografias/jacarey/geo-informativo.jpg',
          caption: 'Adesivo informativo com QR Code instalado no entorno da Lagoa do Jacarey.',
          alt: 'Adesivo informativo de geolocalização com QR Code na Lagoa do Jacarey',
        },
        {
          type: 'image',
          tag: 'Resultado 1',
          src: 'assets/cartografias/jacarey/geo-resultado-1.jpg',
          caption: 'Tsuru 3D posicionado sobre a água da Lagoa do Jacarey em Realidade Aumentada.',
          alt: 'Celular mostrando tsuru 3D em Realidade Aumentada sobre a Lagoa do Jacarey',
        },
        {
          type: 'image',
          tag: 'Resultado 2',
          src: 'assets/cartografias/jacarey/geo-resultado-2.jpg',
          caption: 'Segundo ângulo do tsuru em Realidade Aumentada na Lagoa do Jacarey.',
          alt: 'Outro ângulo do tsuru 3D geolocalizado na Lagoa do Jacarey',
        },
      ],
    },
  };

  namespace.CARTOGRAPHIES_MEDIA = CARTOGRAPHIES_MEDIA;
})();
