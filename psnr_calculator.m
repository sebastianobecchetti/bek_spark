% % Disabilita i warning
% %warning('off', 'all');
%
% % Leggi gli argomenti passati da riga di comando
%
%
%
%
% %img1_path = "/home/sebastiano/easy3dgs-private/build/artifacts/out_no_compr.png";
% %img2_path = "/home/sebastiano/easy3dgs-private/build/artifacts/out_compr.png";
%
% img1_path = "/home/sebastiano/easy3dgs-private/build/artifacts/out_no_compr_sh.png";
% img2_path = "/home/sebastiano/easy3dgs-private/build/artifacts/out_decompr_1600.png";
% % Caricamento immagini
% try
%   I1 = imread(img1_path);
%   I2 = imread(img2_path);
% catch
%   fprintf(stderr, "Errore: Impossibile leggere i file PNG.\n");
% end
%

warning('off', 'all');

% Leggi gli argomenti passati da riga di comando
args = argv();

% Controllo argomenti
if (length(args) != 2)
  fprintf(stderr, "Errore: Uso corretto -> octave --no-gui --quiet calcola_psnr.m <img1.png> <img2.png>\n");
  exit(1);
end

img1_path = args{1};
img2_path = args{2};
try
  I1 = imread(img1_path);
  I2 = imread(img2_path);
catch
  fprintf(stderr, "Errore: Impossibile leggere i file PNG.\n");
end
% Conversione in double per i calcoli
img1 = double(I1);
img2 = double(I2);

% Controllo dimensioni
if (!isequal(size(img1), size(img2)))
  fprintf(stderr, "Errore: Dimensioni diverse.\n");
end

% --- CALCOLO MSE ---
mse_val = mean((img1(:) - img2(:)).^2);

% --- CALCOLO PSNR ---
if (mse_val == 0)
  psnr_val = Inf;
else
  psnr_val = 10 * log10((255^2) / mse_val);
end

% --- CALCOLO SSIM (Native Implementation) ---
function s = calculate_ssim(img1, img2)
    C1 = (0.01 * 255)^2;
    C2 = (0.03 * 255)^2;

    % Se l'immagine è a colori, calcoliamo la media sui canali
    if (ndims(img1) == 3)
        ssim_channels = zeros(1, size(img1, 3));
        for c = 1:size(img1, 3)
            ssim_channels(c) = compute_channel_ssim(img1(:,:,c), img2(:,:,c), C1, C2);
        end
        s = mean(ssim_channels);
    else
        s = compute_channel_ssim(img1, img2, C1, C2);
    end
end

function s_chan = compute_channel_ssim(mu1, mu2, C1, C2)
    % Versione semplificata globale dello SSIM
    m1 = mean(mu1(:));
    m2 = mean(mu2(:));
    v1 = var(mu1(:));
    v2 = var(mu2(:));
    v12 = cov(mu1(:), mu2(:))(1,2);

    s_chan = ((2*m1*m2 + C1) * (2*v12 + C2)) / ((m1^2 + m2^2 + C1) * (v1 + v2 + C2));
end

ssim_val = calculate_ssim(img1, img2);

% --- OUTPUT ---
fprintf("MSE: %.4f\n", mse_val);
fprintf("PSNR: %.2f dB\n", psnr_val);
fprintf("SSIM: %.4f\n", ssim_val);
